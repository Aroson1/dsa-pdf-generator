"use client";

import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  GripHorizontal,
  Plus,
  FileDown,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Image {
  id: string;
  url: string;
}

interface Section {
  id: string;
  title: string;
  algorithm: string;
  problemSolving: Image[];
  code: {
    language: string;
    content: string;
  };
  output: Image[];
  isCollapsed: boolean;
  uploadProgress?: number;
}

if (!process.env.NEXT_PUBLIC_CLOUD_NAME) {
  throw new Error("Missing NEXT_PUBLIC_CLOUD_NAME environment variable");
}
const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
const languages = ["cpp", "c"];
async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); 

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, 
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
}

export default function Home() {
  const [sections, setSections] = useState<Section[]>([]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: crypto.randomUUID(),
        title: "",
        algorithm: "",
        problemSolving: [],
        code: {
          language: "cpp",
          content: "",
        },
        output: [],
        isCollapsed: false,
      },
    ]);
  };

  const toggleCollapse = (id: string) => {
    setSections(
      sections.map((section) =>
        section.id === id
          ? { ...section, isCollapsed: !section.isCollapsed }
          : section
      )
    );
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
    field: "problemSolving" | "output"
  ) => {
    if (!e.target.files?.length) return;

    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, uploadProgress: 0 } : section
      )
    );

    try {
      const newImages: Image[] = [];
      const totalFiles = e.target.files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = e.target.files[i];
        const cloudinaryUrl = await uploadToCloudinary(file);
        newImages.push({ id: crypto.randomUUID(), url: cloudinaryUrl });

        // Update progress
        setSections(
          sections.map((section) =>
            section.id === sectionId
              ? { ...section, uploadProgress: ((i + 1) / totalFiles) * 100 }
              : section
          )
        );
      }

      setSections(
        sections.map((section) => {
          if (section.id === sectionId) {
            return {
              ...section,
              [field]: [...section[field], ...newImages],
              uploadProgress: undefined,
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error("Error handling image upload:", error);
      // Reset progress on error
      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? { ...section, uploadProgress: undefined }
            : section
        )
      );
    }
  };

  const removeImage = (
    sectionId: string,
    imageId: string,
    field: "problemSolving" | "output"
  ) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            [field]: section[field].filter((img) => img.id !== imageId),
          };
        }
        return section;
      })
    );
  };

  const onDragEnd = (
    result: any,
    sectionId: string,
    field: "problemSolving" | "output"
  ) => {
    if (!result.destination) return;

    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const items = Array.from(section[field]);
          const [reorderedItem] = items.splice(result.source.index, 1);
          items.splice(result.destination.index, 0, reorderedItem);
          return { ...section, [field]: items };
        }
        return section;
      })
    );
  };

  const onSectionDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  const generateMarkdown = () => {
    let markdown = "";

    sections.forEach((section) => {
      markdown += `# ${section.title}\n\n`;
      markdown += `1. Algorithm:\n${section.algorithm}\n\n`;
      markdown += `2. Problem Solving:\n`;
      section.problemSolving.forEach((img) => {
        markdown += `> ![Problem Solving](${img.url})\n`;
      });
      markdown += "\n";
      markdown += `3. Code:\n\`\`\`${section.code.language}\n${section.code.content}\n\`\`\`\n\n`;
      markdown += `4. Output:\n`;
      section.output.forEach((img) => {
        markdown += `> ![Output](${img.url})\n`;
      });
      markdown += "\n---\n\n";
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dsa.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">
          DSA PDF Generator
        </h1>

        <div className="flex justify-between mb-8">
          <Button
            onClick={addSection}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
          <Button
            onClick={generateMarkdown}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileDown className="mr-2 h-4 w-4" /> Generate Markdown
          </Button>
        </div>

        <DragDropContext onDragEnd={onSectionDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {sections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="mb-8 bg-slate-900 border-slate-800"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps}>
                                <GripHorizontal className="h-6 w-6 text-slate-500" />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleCollapse(section.id)}
                                className="text-white hover:text-blue-400"
                              >
                                {section.isCollapsed ? (
                                  <ChevronDown className="h-6 w-6" />
                                ) : (
                                  <ChevronUp className="h-6 w-6" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSection(section.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>

                          <Input
                            placeholder="Section Title"
                            value={section.title}
                            onChange={(e) =>
                              setSections(
                                sections.map((s) =>
                                  s.id === section.id
                                    ? { ...s, title: e.target.value }
                                    : s
                                )
                              )
                            }
                            className="mb-4 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                          />

                          {!section.isCollapsed && (
                            <>
                              <Textarea
                                placeholder="Algorithm (Markdown supported)"
                                value={section.algorithm}
                                onChange={(e) =>
                                  setSections(
                                    sections.map((s) =>
                                      s.id === section.id
                                        ? { ...s, algorithm: e.target.value }
                                        : s
                                    )
                                  )
                                }
                                className="mb-4 min-h-[150px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                              />

                              <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-white">
                                  Problem Solving
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(
                                      e,
                                      section.id,
                                      "problemSolving"
                                    )
                                  }
                                  className="mb-2 text-white"
                                />
                                <DragDropContext
                                  onDragEnd={(result) =>
                                    onDragEnd(
                                      result,
                                      section.id,
                                      "problemSolving"
                                    )
                                  }
                                >
                                  <Droppable
                                    droppableId={`problem-${section.id}`}
                                    direction="horizontal"
                                  >
                                    {(provided) => (
                                      <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex gap-4 flex-wrap"
                                      >
                                        {section.problemSolving.map(
                                          (img, index) => (
                                            <Draggable
                                              key={img.id}
                                              draggableId={img.id}
                                              index={index}
                                            >
                                              {(provided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className="relative"
                                                >
                                                  <img
                                                    src={img.url}
                                                    alt="Problem"
                                                    className="w-32 h-32 object-cover rounded"
                                                  />
                                                  <button
                                                    onClick={() =>
                                                      removeImage(
                                                        section.id,
                                                        img.id,
                                                        "problemSolving"
                                                      )
                                                    }
                                                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </Draggable>
                                          )
                                        )}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                              </div>

                              <div className="mb-4">
                                <Select
                                  value={section.code.language}
                                  onValueChange={(value) =>
                                    setSections(
                                      sections.map((s) =>
                                        s.id === section.id
                                          ? {
                                              ...s,
                                              code: {
                                                ...s.code,
                                                language: value,
                                              },
                                            }
                                          : s
                                      )
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[200px] mb-2 bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Select Language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {languages.map((lang) => (
                                      <SelectItem key={lang} value={lang}>
                                        {lang.charAt(0).toUpperCase() +
                                          lang.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  placeholder="Code"
                                  value={section.code.content}
                                  onChange={(e) =>
                                    setSections(
                                      sections.map((s) =>
                                        s.id === section.id
                                          ? {
                                              ...s,
                                              code: {
                                                ...s.code,
                                                content: e.target.value,
                                              },
                                            }
                                          : s
                                      )
                                    )
                                  }
                                  className="font-mono min-h-[200px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-2 text-white">
                                  Output
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(e, section.id, "output")
                                  }
                                  className="mb-2 text-white"
                                />
                                <DragDropContext
                                  onDragEnd={(result) =>
                                    onDragEnd(result, section.id, "output")
                                  }
                                >
                                  <Droppable
                                    droppableId={`output-${section.id}`}
                                    direction="horizontal"
                                  >
                                    {(provided) => (
                                      <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex gap-4 flex-wrap"
                                      >
                                        {section.output.map((img, index) => (
                                          <Draggable
                                            key={img.id}
                                            draggableId={img.id}
                                            index={index}
                                          >
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="relative"
                                              >
                                                <img
                                                  src={img.url}
                                                  alt="Output"
                                                  className="w-32 h-32 object-cover rounded"
                                                />
                                                <button
                                                  onClick={() =>
                                                    removeImage(
                                                      section.id,
                                                      img.id,
                                                      "output"
                                                    )
                                                  }
                                                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                                                >
                                                  <X className="h-4 w-4" />
                                                </button>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
