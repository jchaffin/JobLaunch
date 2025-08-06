// @/components/pdf/ResumeUpload.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  FileText,
  Upload,
  X,
  Plus,
  Edit,
  Sparkles,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Bold,
  Italic,
  List,
  Link,
  Trash2,
  Type,
  ArrowLeft,
  RefreshCw,
  Target,
  User,
  Edit2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UnifiedDatePicker from "@/components/ui/UnifiedDatePicker";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { StructuredResumePreview } from "@/components/structured-resume-preview";
import { GooglePlacesAutocomplete, CollegeScorecardAutocomplete } from "@/components/AutoComplete";


interface ParsedResume {
  summary: string;
  skills: string[];
  jobTitle?: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    startDate?: Date;
    endDate?: Date;
    isCurrentRole?: boolean;
    location?: string;
    description?: string;
    achievements: string[];
    responsibilities: string[];
    keywords: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    year: string;
    graduationDate?: Date;
    location?: string;
    gpa?: string;
    honors?: string;
  }>;
  contact: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    address?: string;
    country?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  ats_score: string;
  ats_recommendations: string[];
  tailoring_notes?: {
    keyChanges?: string[];
    keywordsAdded?: string[];
    focusAreas?: string[];
  };
}

interface ResumeUploadProps {
  onResumeUploaded?: (resumeData: ParsedResume | null) => void;
  currentResume?: ParsedResume | null;
  autoParseExisting?: boolean;
}

// Hook to fetch degrees from database
const useEducationData = () => {
  const { data: degreesData, isLoading: degreesLoading } = useQuery({
    queryKey: ["/api/education/degrees"],
    queryFn: async () => {
      const response = await fetch("/api/education/degrees");
      if (!response.ok) throw new Error("Failed to fetch degrees");
      return response.json();
    },
  });

  const { data: institutionsData, isLoading: institutionsLoading } = useQuery({
    queryKey: ["/api/education/institutions"],
    queryFn: async () => {
      const response = await fetch("/api/education/institutions");
      if (!response.ok) throw new Error("Failed to fetch institutions");
      return response.json();
    },
  });

  return {
    degrees: degreesData?.degrees || [],
    institutions: institutionsData?.institutions || [],
    isLoading: degreesLoading || institutionsLoading,
  };
};

export default function ResumeUpload({
  onResumeUploaded,
  currentResume,
  autoParseExisting = false,
}: ResumeUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showEditForm, setShowEditForm] = useState(true);
  const [showUploadNew, setShowUploadNew] = useState(!currentResume);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(
    currentResume || null,
  );
  const [editableData, setEditableData] = useState<ParsedResume>(() => {
    console.log("Initializing editableData with currentResume:", currentResume);
    return (
      currentResume || {
        summary: "",
        skills: [],
        experience: [],
        education: [],
        contact: {
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          github: "",
          website: "",
        },
        ats_score: "",
        ats_recommendations: [],
      }
    );
  });
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(
    new Set(),
  );

  // Modal editing state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<
    "summary" | "jobDescription" | "achievement" | null
  >(null);
  const [modalOriginalText, setModalOriginalText] = useState("");
  const [modalEditedText, setModalEditedText] = useState("");
  const [modalIsProcessing, setModalIsProcessing] = useState(false);
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState<
    number | null
  >(null);
  const [selectedAchievementIndex, setSelectedAchievementIndex] = useState<
    number | null
  >(null);
  const [skillInputValue, setSkillInputValue] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState("");
  const [expandedExperience, setExpandedExperience] = useState<Set<number>>(
    new Set([0]),
  ); // First experience expanded by default

  // Fetch education data from database - currently not using institutions/loading state
  // const { institutions, isLoading: educationLoading } = useEducationData();

  // Helper functions
  const addSkill = () => {
    if (
      skillInputValue.trim() &&
      !editableData.skills.includes(skillInputValue.trim())
    ) {
      setEditableData({
        ...editableData,
        skills: [...editableData.skills, skillInputValue.trim()],
      });
      setSkillInputValue("");
    }
  };

  const addExperience = () => {
    const newExperience = {
      company: "",
      role: "",
      duration: "",
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      isCurrentRole: false,
      location: "",
      description: "",
      achievements: [] as string[],
      responsibilities: [] as string[],
      keywords: [] as string[],
    };
    setEditableData({
      ...editableData,
      experience: [...(editableData.experience || []), newExperience],
    });
    const newIndex = (editableData.experience || []).length;
    setExpandedExperience((prev) => new Set([...prev, newIndex]));
  };

  const addEducation = () => {
    const newEducation = {
      institution: "",
      degree: "",
      field: "",
      year: "",
      graduationDate: undefined as Date | undefined,
      location: "",
      gpa: "",
      honors: "",
    };
    setEditableData({
      ...editableData,
      education: [...(editableData.education || []), newEducation],
    });
  };

  const toggleExperienceExpansion = (index: number) => {
    setExpandedExperience((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
        handleFileUpload({ target: { files: [file] } } as any);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".docx")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setIsParsing(true);
    setParsingProgress("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      setParsingProgress("Processing resume data...");

      if (result.success && result.data) {
        console.log("Upload successful, setting parsed data:", result.data);
        setParsedData(result.data);
        setEditableData(result.data);
        setShowEditForm(true); // Show the parsed resume data
        setShowPreview(true); // Show the preview
        setShowUploadNew(false); // Hide upload interface
        setShowTextInput(false); // Hide text input

        onResumeUploaded?.(result.data);

        // Cache the data
        localStorage.setItem("parsedResumeData", JSON.stringify(result.data));


      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      setParsingProgress("");
    }
  };

  const handleTextSubmit = async () => {
    if (!resumeText.trim()) return;

    setIsParsing(true);
    setParsingProgress("Processing text...");

    try {
      const response = await fetch("/api/resume/parse-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: resumeText }),
      });

      if (!response.ok) {
        throw new Error("Parsing failed");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setParsedData(result.data);
        setEditableData(result.data);
        onResumeUploaded?.(result.data);

        // Cache the data
        localStorage.setItem("parsedResumeData", JSON.stringify(result.data));

        toast({
          title: "Resume processed successfully",
          description:
            "Your resume text has been processed and is ready for editing.",
        });

        setShowTextInput(false);
        setResumeText("");
      }
    } catch (error) {
      console.error("Parsing error:", error);
      toast({
        title: "Processing failed",
        description:
          "There was an error processing your resume text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
      setParsingProgress("");
    }
  };

  const parseExistingDocument = useCallback(
    async (document: any) => {
      setIsUploading(true);
      setIsParsing(true);
      setParsingProgress("Downloading document...");
      try {
        // Download the document and parse it
        const downloadResponse = await fetch(document.signedDownloadUrl);
        if (!downloadResponse.ok)
          throw new Error("Failed to download document");

        const { downloadUrl } = await downloadResponse.json();
        const fileResponse = await fetch(downloadUrl);
        const blob = await fileResponse.blob();
        const file = new File([blob], document.fileName, {
          type: "application/pdf",
        });

        // Parse the downloaded file
        setParsingProgress("Extracting text from PDF...");
        const formData = new FormData();
        formData.append("file", file);

        setParsingProgress("Analyzing resume with AI...");
        const response = await fetch("/api/resume?action=upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Parsing failed");
        }

        const data = await response.json();
        setParsingProgress("Finalizing resume data...");
        setParsedData(data);
        setEditableData(data);
        setIsEditing(false); // Ensure editing is disabled after parsing
        setShowEditForm(true); // Show edit form after successful upload
        setShowPreview(true);


      } catch (error) {
        console.error("Auto-parse error:", error);
        toast({
          title: "Auto-parse failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to parse existing document",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setIsParsing(false);
        setParsingProgress("");
      }
    },
    [toast],
  );

  // Load cached resume data from localStorage on component mount
  useEffect(() => {
    const loadCachedResume = () => {
      try {
        // If we have a current resume and auto-parse is enabled, parse it
        if (currentResume && autoParseExisting) {
          parseExistingDocument(currentResume);
          return;
        }

        const cachedResume = localStorage.getItem("parsedResumeData");
        if (cachedResume && !currentResume) {
          const resumeData = JSON.parse(cachedResume);

          // Convert date strings back to Date objects if they exist
          if (resumeData.experience) {
            resumeData.experience = resumeData.experience.map((exp: any) => ({
              ...exp,
              startDate: exp.startDate ? new Date(exp.startDate) : undefined,
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            }));
          }

          if (resumeData.education) {
            resumeData.education = resumeData.education.map((edu: any) => ({
              ...edu,
              graduationDate: edu.graduationDate
                ? new Date(edu.graduationDate)
                : undefined,
            }));
          }

          setParsedData(resumeData);
          setEditableData(resumeData);
          setIsEditing(false); // Ensure editing is disabled by default
          setShowEditForm(true); // SHOW the edit form with loaded data
          setShowUploadNew(false); // Hide upload interface
          onResumeUploaded?.(resumeData);

          toast({
            title: "Resume loaded from cache",
            description: "Your previously uploaded resume has been restored.",
          });
        }
      } catch (error) {
        console.error("Error loading cached resume:", error);
        // Clear invalid cache
        localStorage.removeItem("parsedResumeData");
      }
    };

    loadCachedResume();
  }, [currentResume, autoParseExisting, toast, parseExistingDocument]);

  // Save resume data to localStorage whenever editableData changes
  useEffect(() => {
    if (
      editableData &&
      editableData.summary &&
      editableData.experience &&
      editableData.experience.length > 0
    ) {
      try {
        localStorage.setItem("parsedResumeData", JSON.stringify(editableData));
      } catch (error) {
        console.error("Error saving resume to cache:", error);
      }
    }
  }, [editableData]);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf" && !file.name.endsWith(".docx")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      setIsParsing(true);
      setParsingProgress("Uploading file...");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/resume?action=upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();

        setParsingProgress("Processing resume data...");

        if (result.success && result.data) {
          const resumeData = result.data;
          console.log("UPLOAD SUCCESS - Resume data received:", resumeData);
          console.log("Summary exists:", !!resumeData.summary);
          console.log("Contact info:", resumeData.contact);

          // Update states with new data
          setParsedData(resumeData);
          setEditableData(resumeData);
          setShowUploadNew(false);
          setShowTextInput(false);

          // Call parent callback
          onResumeUploaded?.(resumeData);

          // Save to localStorage
          localStorage.setItem("parsedResumeData", JSON.stringify(resumeData));

          // Force a re-render check
          setTimeout(() => {
            console.log(
              "TIMEOUT CHECK - editableData state after upload:",
              editableData,
            );
          }, 100);


        }
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description:
            "There was an error uploading your resume. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setIsParsing(false);
        setParsingProgress("");
      }
    },
    [toast, onResumeUploaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  const handleSaveEdits = useCallback(() => {
    onResumeUploaded?.(editableData);

    // Save to localStorage cache
    try {
      localStorage.setItem("parsedResumeData", JSON.stringify(editableData));
    } catch (error) {
      console.error("Error saving resume to cache:", error);
    }

    // Keep the form data persistent after saving and return to preview
    setParsedData(editableData);
    setShowEditForm(false);
    setIsEditing(false);

    toast({
      title: isEditing
        ? "Resume updated successfully"
        : "Resume saved successfully",
      description: isEditing
        ? "Your resume changes have been saved and added to your documents."
        : "Your resume has been processed and added to your documents collection.",
    });
  }, [editableData, onResumeUploaded, toast, isEditing]);

  const clearResumeCache = useCallback(() => {
    localStorage.removeItem("parsedResumeData");
    setParsedData(null);
    setEditableData({
      summary: "",
      skills: [],
      experience: [],
      education: [],
      contact: {
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        website: "",
      },
      ats_score: "",
      ats_recommendations: [],
    });
    setShowEditForm(false);
    setShowUploadNew(false);

    toast({
      title: "Resume cleared",
      description: "Cached resume data has been removed.",
      variant: "default",
    });
  }, [toast]);

  const handleUploadNew = useCallback(() => {
    // Clear all data and reset to upload state
    clearResumeCache();
    // Force clear the parent state too
    onResumeUploaded?.(null);
    setShowEditForm(false);
    setShowUploadNew(true);
    setShowTextInput(false);
    setResumeText("");
    setSelectedFileName("");

    toast({
      title: "Ready for new upload",
      description: "Previous data cleared. Upload a new resume.",
    });
  }, [clearResumeCache, onResumeUploaded, toast]);

  // Modal editing functions
  const openEditModal = (
    type: "summary" | "jobDescription" | "achievement",
    experienceIndex?: number,
    achievementIndex?: number,
  ) => {
    let originalText = "";

    if (type === "summary") {
      originalText = editableData.summary || "";
    } else if (
      type === "jobDescription" &&
      typeof experienceIndex === "number"
    ) {
      originalText =
        editableData.experience?.[experienceIndex]?.description || "";
      setSelectedExperienceIndex(experienceIndex);
    } else if (
      type === "achievement" &&
      typeof experienceIndex === "number" &&
      typeof achievementIndex === "number"
    ) {
      originalText =
        editableData.experience?.[experienceIndex]?.achievements?.[
          achievementIndex
        ] || "";
      setSelectedExperienceIndex(experienceIndex);
      setSelectedAchievementIndex(achievementIndex);
    }

    setModalOriginalText(originalText);
    setModalEditedText(originalText);
    setEditModalType(type);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditModalType(null);
    setModalOriginalText("");
    setModalEditedText("");
    setModalIsProcessing(false);
    setSelectedExperienceIndex(null);
    setSelectedAchievementIndex(null);
  };

  const handleModalSave = () => {
    if (!editModalType) return;

    if (editModalType === "summary") {
      setEditableData({
        ...editableData,
        summary: modalEditedText,
      });
    } else if (
      editModalType === "jobDescription" &&
      selectedExperienceIndex !== null
    ) {
      const newExperience = [...(editableData.experience || [])];
      newExperience[selectedExperienceIndex] = {
        ...newExperience[selectedExperienceIndex],
        description: modalEditedText,
      };
      setEditableData({
        ...editableData,
        experience: newExperience,
      });
    } else if (
      editModalType === "achievement" &&
      selectedExperienceIndex !== null &&
      selectedAchievementIndex !== null
    ) {
      const newExperience = [...(editableData.experience || [])];
      const newAchievements = [
        ...(newExperience[selectedExperienceIndex].achievements || []),
      ];
      newAchievements[selectedAchievementIndex] = modalEditedText;
      newExperience[selectedExperienceIndex] = {
        ...newExperience[selectedExperienceIndex],
        achievements: newAchievements,
      };
      setEditableData({
        ...editableData,
        experience: newExperience,
      });
    }

    closeEditModal();
  };

  const handleModalAI = async (mode: "improve" | "generate") => {
    if (!editModalType) return;

    setModalIsProcessing(true);

    try {
      let focusArea = "";
      let contextData = { ...editableData };

      if (editModalType === "summary") {
        focusArea = "summary";
        contextData.summary = modalEditedText;
      } else if (editModalType === "jobDescription") {
        focusArea = "jobDescription";
        if (selectedExperienceIndex !== null) {
          const updatedExp = [...(editableData.experience || [])];
          updatedExp[selectedExperienceIndex] = {
            ...updatedExp[selectedExperienceIndex],
            description: modalEditedText,
          };
          contextData.experience = updatedExp;
        }
      } else if (editModalType === "achievement") {
        focusArea = "achievement";
        if (
          selectedExperienceIndex !== null &&
          selectedAchievementIndex !== null
        ) {
          const updatedExp = [...(editableData.experience || [])];
          const updatedAchievements = [
            ...(updatedExp[selectedExperienceIndex].achievements || []),
          ];
          updatedAchievements[selectedAchievementIndex] = modalEditedText;
          updatedExp[selectedExperienceIndex] = {
            ...updatedExp[selectedExperienceIndex],
            achievements: updatedAchievements,
          };
          contextData.experience = updatedExp;
        }
      }

      const response = await fetch("/api/resume/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: contextData,
          focusArea,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} content`);
      }

      const improvedData = await response.json();

      // Extract the improved text based on the modal type
      let improvedText = "";
      if (editModalType === "summary") {
        improvedText = improvedData.summary || "";
      } else if (
        editModalType === "jobDescription" &&
        selectedExperienceIndex !== null
      ) {
        improvedText =
          improvedData.experience?.[selectedExperienceIndex]?.description || "";
      } else if (
        editModalType === "achievement" &&
        selectedExperienceIndex !== null &&
        selectedAchievementIndex !== null
      ) {
        improvedText =
          improvedData.experience?.[selectedExperienceIndex]?.achievements?.[
            selectedAchievementIndex
          ] || "";
      }

      setModalEditedText(improvedText);

      toast({
        title: `Content ${mode}d`,
        description: `AI has ${mode}d your ${editModalType.replace(/([A-Z])/g, " $1").toLowerCase()}.`,
      });
    } catch (error) {
      console.error(`Error ${mode}ing content:`, error);
      toast({
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} failed`,
        description: `There was an error ${mode}ing the content.`,
        variant: "destructive",
      });
    } finally {
      setModalIsProcessing(false);
    }
  };

  return (
    <div className="relative space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>Resume Upload</span>
          </CardTitle>
          <CardDescription>
            Upload your resume to personalize AI responses based on your
            experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Debug: currentResume: {String(!!currentResume)}, editableData.summary: {String(!!editableData?.summary)}, showEditForm: {String(showEditForm)}, isUploading: {String(isUploading)}, isParsing: {String(isParsing)} */}

          {/* Loading State */}
          {(isUploading || isParsing) && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">
                  {parsingProgress || "Processing..."}
                </p>
              </div>
            </div>
          )}

          {/* Show Upload Interface When No Data */}
          {!isUploading &&
            !isParsing &&
            !editableData?.summary &&
            !parsedData?.summary &&
            !currentResume && (
              <div className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Upload your resume
                      </h3>
                      <p className="text-sm text-gray-500">
                        Drag and drop your PDF or DOCX file here, or click to
                        browse
                      </p>
                    </div>
                    <input
                      type="file"
                      id="resume-file"
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                    />
                    <Button
                      onClick={() =>
                        document.getElementById("resume-file")?.click()
                      }
                      disabled={isUploading}
                      className="mx-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Or manually enter your resume information
                  </p>
                  <Button
                    onClick={() => setShowTextInput(!showTextInput)}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>

                {showTextInput && (
                  <div className="space-y-4">
                    <Label htmlFor="resume-text">Paste your resume text</Label>
                    <Textarea
                      id="resume-text"
                      placeholder="Paste your resume content here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[200px]"
                    />
                    <Button
                      onClick={handleTextSubmit}
                      disabled={isParsing || !resumeText.trim()}
                    >
                      {isParsing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {parsingProgress || "Processing..."}
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Process Resume
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

          {/* Show Success Display When Data Exists */}
          {!isUploading &&
            !isParsing &&
            (editableData?.summary || parsedData?.summary || currentResume) && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveEdits} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Resume
                    </Button>
                    <Button
                      onClick={handleUploadNew}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New
                    </Button>
                    <Button
                      onClick={clearResumeCache}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <p className="font-medium">
                    ✅ Resume Uploaded Successfully!
                  </p>
                  <p className="text-sm">
                    Your resume has been parsed and is ready for editing. Found:
                  </p>
                  <ul className="text-sm mt-2 list-disc list-inside">
                    <li>
                      Summary:{" "}
                      {(
                        editableData?.summary ||
                        parsedData?.summary ||
                        ""
                      ).slice(0, 100)}
                      ...
                    </li>
                    <li>
                      Skills:{" "}
                      {
                        (editableData?.skills || parsedData?.skills || [])
                          .length
                      }{" "}
                      skills
                    </li>
                    <li>
                      Experience:{" "}
                      {
                        (
                          editableData?.experience ||
                          parsedData?.experience ||
                          []
                        ).length
                      }{" "}
                      roles
                    </li>
                    <li>
                      Education:{" "}
                      {
                        (editableData?.education || parsedData?.education || [])
                          .length
                      }{" "}
                      degrees
                    </li>
                  </ul>
                  <div className="mt-4">
                    <Button onClick={handleSaveEdits} className="mr-2">
                      Save to Documents
                    </Button>
                    <Button onClick={handleUploadNew} variant="outline">
                      Upload Another
                    </Button>
                  </div>
                </div>

                {/* Show full edit form with parsed data */}
                <div className="mt-6 space-y-6">
                  {/* Personal Details Card */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Personal Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Job Title */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Job Title
                        </Label>
                        <Input
                          value={editableData?.jobTitle || ""}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              jobTitle: e.target.value,
                            })
                          }
                          placeholder="e.g., Senior Software Engineer"
                          className="focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            First Name
                          </Label>
                          <Input
                            value={editableData?.contact?.firstName || ""}
                            onChange={(e) =>
                              setEditableData({
                                ...editableData,
                                contact: {
                                  ...editableData.contact,
                                  firstName: e.target.value,
                                },
                              })
                            }
                            placeholder="First name"
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Last Name
                          </Label>
                          <Input
                            value={editableData?.contact?.lastName || ""}
                            onChange={(e) =>
                              setEditableData({
                                ...editableData,
                                contact: {
                                  ...editableData.contact,
                                  lastName: e.target.value,
                                },
                              })
                            }
                            placeholder="Last name"
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Email
                          </Label>
                          <Input
                            type="email"
                            value={editableData?.contact?.email || ""}
                            onChange={(e) =>
                              setEditableData({
                                ...editableData,
                                contact: {
                                  ...editableData.contact,
                                  email: e.target.value,
                                },
                              })
                            }
                            placeholder="your.email@example.com"
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Phone
                          </Label>
                          <Input
                            value={editableData?.contact?.phone || ""}
                            onChange={(e) =>
                              setEditableData({
                                ...editableData,
                                contact: {
                                  ...editableData.contact,
                                  phone: e.target.value,
                                },
                              })
                            }
                            placeholder="(555) 123-4567"
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Location
                        </Label>
                        <Input
                          value={editableData?.contact?.location || ""}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              contact: {
                                ...editableData.contact,
                                location: e.target.value,
                              },
                            })
                          }
                          placeholder="City, State"
                          className="focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professional Summary */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Professional Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Summary
                        </Label>
                        <Textarea
                          value={editableData?.summary || ""}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              summary: e.target.value,
                            })
                          }
                          placeholder="Brief professional summary..."
                          className="min-h-[120px] focus:ring-2 focus:ring-blue-500"
                          rows={5}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Skills (comma-separated)
                        </Label>
                        <Textarea
                          value={editableData?.skills?.join(", ") || ""}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              skills: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="JavaScript, React, Node.js, etc."
                          className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

          {/* Upload interface */}
          {!showEditForm && (
            <div className="space-y-6">
              {showUploadNew && (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Upload your resume
                      </h3>
                      <p className="text-sm text-gray-500">
                        Drag and drop your PDF or DOCX file here, or click to
                        browse
                      </p>
                    </div>
                    <input
                      type="file"
                      id="resume-file"
                      className="hidden"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                    />
                    <Button
                      onClick={() =>
                        document.getElementById("resume-file")?.click()
                      }
                      disabled={isUploading}
                      className="mx-auto"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Or manually enter your resume information
                </p>
                <Button
                  onClick={() => setShowTextInput(!showTextInput)}
                  variant="outline"
                  className="mr-2"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
                <Button
                  onClick={() => setShowUploadNew(!showUploadNew)}
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
                {(parsedData || editableData.summary) && (
                  <Button
                    onClick={clearResumeCache}
                    variant="outline"
                    className="ml-2"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                )}
              </div>

              {showTextInput && (
                <div className="space-y-4">
                  <Label htmlFor="resume-text">Paste your resume text</Label>
                  <Textarea
                    id="resume-text"
                    placeholder="Paste your resume content here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <Button
                    onClick={handleTextSubmit}
                    disabled={isParsing || !resumeText.trim()}
                  >
                    {isParsing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {parsingProgress || "Processing..."}
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Process Resume
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Resume uploaded state - Show preview */}
          {!isUploading && !isParsing && currentResume && !showEditForm && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Resume Uploaded
                    </h3>
                    <p className="text-sm text-gray-500">
                      Your resume has been processed successfully
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowEditForm(true)} size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Resume
                  </Button>
                  <Button onClick={handleUploadNew} variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New
                  </Button>
                </div>
              </div>

              {showPreview && parsedData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <StructuredResumePreview resumeData={parsedData} />
                </div>
              )}
            </div>
          )}

          {/* Full edit form view - fallback or override */}
          {!isUploading &&
            !isParsing &&
            (editableData?.summary || currentResume) &&
            showEditForm && (
              <div className="space-y-6">
                {/* Header with action buttons */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Resume Upload
                    </h2>
                    <p className="text-gray-600">
                      Upload your resume to personalize AI responses based on
                      your experience
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowEditForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleUploadNew}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New
                    </Button>
                    <Button
                      onClick={clearResumeCache}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>

                {/* Personal Details Card */}
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Personal details
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Job Title */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Job Title
                      </Label>
                      <Input
                        placeholder="e.g. Fullstack Engineer | Voice AI"
                        value={
                          editableData.jobTitle ||
                          "Fullstack Engineer | Voice AI"
                        }
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            jobTitle: e.target.value,
                          })
                        }
                        className="text-sm font-medium"
                      />
                    </div>

                    {/* Profile Photo Section */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 p-0 h-auto"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit photo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 p-0 h-auto block"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          First Name
                        </Label>
                        <Input
                          placeholder="Jacob"
                          value={
                            editableData.contact?.firstName ||
                            editableData.contact?.name?.split(" ")[0] ||
                            ""
                          }
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              contact: {
                                ...editableData.contact,
                                firstName: e.target.value,
                              },
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          placeholder="Chaffin"
                          value={
                            editableData.contact?.lastName ||
                            editableData.contact?.name?.split(" ")[1] ||
                            ""
                          }
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              contact: {
                                ...editableData.contact,
                                lastName: e.target.value,
                              },
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          type="email"
                          placeholder="jchaffin57@gmail.com"
                          value={editableData.contact?.email || ""}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              contact: {
                                ...editableData.contact,
                                email: e.target.value,
                              },
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Phone
                        </Label>
                        <Input
                          placeholder="6503803288"
                          value={editableData.contact?.phone || ""}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              contact: {
                                ...editableData.contact,
                                phone: e.target.value,
                              },
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Address
                      </Label>
                      <Input
                        placeholder="94530"
                        value={editableData.contact?.address || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            contact: {
                              ...editableData.contact,
                              address: e.target.value,
                            },
                          })
                        }
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          City / State
                        </Label>
                        <GooglePlacesAutocomplete
                          value={
                            editableData.contact?.location || "SF Bay Area"
                          }
                          onChange={(location) =>
                            setEditableData({
                              ...editableData,
                              contact: { ...editableData.contact, location },
                            })
                          }
                          placeholder="SF Bay Area"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Country
                        </Label>
                        <Input
                          placeholder="United States"
                          value={
                            editableData.contact?.country || "United States"
                          }
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              contact: {
                                ...editableData.contact,
                                country: e.target.value,
                              },
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="text-blue-600 p-0 h-auto justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add more details
                    </Button>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Contact Information
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={editableData.contact?.email || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            contact: {
                              ...editableData.contact,
                              email: e.target.value,
                            },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        value={editableData.contact?.phone || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            contact: {
                              ...editableData.contact,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-sm">
                        Location
                      </Label>
                      <GooglePlacesAutocomplete
                        value={editableData.contact?.location || ""}
                        onChange={(location) =>
                          setEditableData({
                            ...editableData,
                            contact: { ...editableData.contact, location },
                          })
                        }
                        placeholder="City, State"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin" className="text-sm">
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        placeholder="linkedin.com/in/yourprofile"
                        value={editableData.contact?.linkedin || ""}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            contact: {
                              ...editableData.contact,
                              linkedin: e.target.value,
                            },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editableData.skills?.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0 text-gray-500 hover:text-red-500"
                          onClick={() => {
                            const newSkills = editableData.skills.filter(
                              (_, i) => i !== index,
                            );
                            setEditableData({
                              ...editableData,
                              skills: newSkills,
                            });
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a skill..."
                      value={skillInputValue}
                      onChange={(e) => setSkillInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addSkill();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button onClick={addSkill} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Work Experience */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      Work Experience
                    </Label>
                    <Button onClick={addExperience} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Experience
                    </Button>
                  </div>
                  {editableData.experience?.map((exp, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            onClick={() => toggleExperienceExpansion(index)}
                            className="flex items-center space-x-2 p-0 h-auto text-left"
                          >
                            {expandedExperience.has(index) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {exp.role || "Job Title"} •{" "}
                                {exp.company || "Company"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {exp.startDate instanceof Date &&
                                !isNaN(exp.startDate.getTime())
                                  ? format(exp.startDate, "MMM yyyy")
                                  : String(exp.startDate || "Start")}{" "}
                                -{" "}
                                {exp.isCurrentRole
                                  ? "Present"
                                  : exp.endDate instanceof Date &&
                                      !isNaN(exp.endDate.getTime())
                                    ? format(exp.endDate, "MMM yyyy")
                                    : String(exp.endDate || "End")}{" "}
                                • {exp.location || "Location"}
                              </div>
                            </div>
                          </Button>
                        </div>

                        {expandedExperience.has(index) && (
                          <div className="space-y-4 pl-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor={`jobTitle-${index}`}
                                  className="text-sm"
                                >
                                  Job Title
                                </Label>
                                <Input
                                  id={`jobTitle-${index}`}
                                  placeholder="Software Engineer"
                                  value={exp.role || ""}
                                  onChange={(e) => {
                                    const newExp = [
                                      ...(editableData.experience || []),
                                    ];
                                    newExp[index] = {
                                      ...exp,
                                      role: e.target.value,
                                    };
                                    setEditableData({
                                      ...editableData,
                                      experience: newExp,
                                    });
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`company-${index}`}
                                  className="text-sm"
                                >
                                  Company
                                </Label>
                                <Input
                                  id={`company-${index}`}
                                  placeholder="Company Name"
                                  value={exp.company || ""}
                                  onChange={(e) => {
                                    const newExp = [
                                      ...(editableData.experience || []),
                                    ];
                                    newExp[index] = {
                                      ...exp,
                                      company: e.target.value,
                                    };
                                    setEditableData({
                                      ...editableData,
                                      experience: newExp,
                                    });
                                  }}
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            <div
                              className={`grid gap-4 ${exp.isCurrentRole ? "grid-cols-2" : "grid-cols-3"}`}
                            >
                              <div>
                                <Label className="text-sm">Start Date</Label>
                                <UnifiedDatePicker
                                  mode="date"
                                  value={exp.startDate ?? undefined} // must be Date | undefined
                                  onChange={(d) => {
                                    const newExp = [
                                      ...(editableData.experience || []),
                                    ];
                                    newExp[index] = {
                                      ...exp,
                                      startDate: d || undefined,
                                    };
                                    setEditableData({
                                      ...editableData,
                                      experience: newExp,
                                    });
                                  }}
                                  placeholder="MM/DD/YYYY"
                                />
                              </div>
                              {!exp.isCurrentRole && (
                                <div>
                                  <Label className="text-sm">End Date</Label>
                                  <UnifiedDatePicker
                                    mode="date"
                                    value={
                                      exp.endDate
                                        ? new Date(exp.endDate)
                                        : undefined
                                    }
                                    onChange={(date) => {
                                      const newExp = [
                                        ...(editableData.experience || []),
                                      ];
                                      newExp[index] = {
                                        ...exp,
                                        endDate: date || undefined,
                                      };
                                      setEditableData({
                                        ...editableData,
                                        experience: newExp,
                                      });
                                    }}
                                    placeholder="MM/DD/YYYY"
                                  />
                                </div>
                              )}
                              <div className="flex items-end">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`current-${index}`}
                                    checked={exp.isCurrentRole || false}
                                    onChange={(e) => {
                                      const newExp = [
                                        ...(editableData.experience || []),
                                      ];
                                      newExp[index] = {
                                        ...exp,
                                        isCurrentRole: e.target.checked,
                                        endDate: e.target.checked
                                          ? undefined
                                          : exp.endDate,
                                      };
                                      setEditableData({
                                        ...editableData,
                                        experience: newExp,
                                      });
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  />
                                  <Label
                                    htmlFor={`current-${index}`}
                                    className="text-sm"
                                  >
                                    Current Role
                                  </Label>
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label
                                htmlFor={`location-${index}`}
                                className="text-sm"
                              >
                                Location
                              </Label>
                              <GooglePlacesAutocomplete
                                value={exp.location || ""}
                                onChange={(location) => {
                                  const newExp = [
                                    ...(editableData.experience || []),
                                  ];
                                  newExp[index] = { ...exp, location };
                                  setEditableData({
                                    ...editableData,
                                    experience: newExp,
                                  });
                                }}
                                placeholder="City, State"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium text-gray-700">
                                  Job Description
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 text-xs px-2 h-6"
                                  onClick={() =>
                                    openEditModal("jobDescription", index, 0)
                                  }
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI
                                </Button>
                              </div>
                              <Textarea
                                placeholder="Describe your role and responsibilities..."
                                value={exp.description || ""}
                                onChange={(e) => {
                                  const newExp = [
                                    ...(editableData.experience || []),
                                  ];
                                  newExp[index] = {
                                    ...exp,
                                    description: e.target.value,
                                  };
                                  setEditableData({
                                    ...editableData,
                                    experience: newExp,
                                  });
                                }}
                                className="min-h-[100px] text-sm resize-none"
                                rows={4}
                              />
                            </div>

                            <div className="flex justify-end pt-2 border-t">
                              <Button
                                onClick={() => {
                                  const newExp = editableData.experience.filter(
                                    (_, i) => i !== index,
                                  );
                                  setEditableData({
                                    ...editableData,
                                    experience: newExp,
                                  });
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Education */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Education</Label>
                    <Button onClick={addEducation} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Education
                    </Button>
                  </div>
                  {editableData.education?.map((edu, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label
                            htmlFor={`degree-${index}`}
                            className="text-sm"
                          >
                            Degree
                          </Label>
                          <Select
                            value={edu.degree || ""}
                            onValueChange={(value) => {
                              const newEdu = [
                                ...(editableData.education || []),
                              ];
                              newEdu[index] = { ...edu, degree: value };
                              setEditableData({
                                ...editableData,
                                education: newEdu,
                              });
                            }}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select degree" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bachelor of Science">
                                Bachelor of Science
                              </SelectItem>
                              <SelectItem value="Bachelor of Arts">
                                Bachelor of Arts
                              </SelectItem>
                              <SelectItem value="Master of Science">
                                Master of Science
                              </SelectItem>
                              <SelectItem value="Master of Arts">
                                Master of Arts
                              </SelectItem>
                              <SelectItem value="MBA">MBA</SelectItem>
                              <SelectItem value="PhD">PhD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label
                            htmlFor={`institution-${index}`}
                            className="text-sm"
                          >
                            Institution
                          </Label>
                          <CollegeScorecardAutocomplete
                            value={edu.institution || ""}
                            onChange={(institution) => {
                              const newEdu = [
                                ...(editableData.education || []),
                              ];
                              newEdu[index] = { ...edu, institution };
                              setEditableData({
                                ...editableData,
                                education: newEdu,
                              });
                            }}
                            placeholder="University name"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Graduation Date</Label>
                          <UnifiedDatePicker
                            mode="month-year"
                            value={edu.graduationDate}
                            onChange={(date: Date | undefined) => {
                              const newEdu = [
                                ...(editableData.education || []),
                              ];
                              newEdu[index] = {
                                ...edu,
                                graduationDate: date,
                              };
                              setEditableData({
                                ...editableData,
                                education: newEdu,
                              });
                            }}
                            placeholder="MM/YYYY"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => {
                            const newEdu = editableData.education.filter(
                              (_, i) => i !== index,
                            );
                            setEditableData({
                              ...editableData,
                              education: newEdu,
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Header Section moved to bottom */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">
                          Resume
                        </h1>
                        <div className="flex items-center mt-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm text-gray-600">English</span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          Customize
                        </Button>
                        <Button
                          onClick={handleSaveEdits}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Download PDF
                        </Button>
                        <Button
                          onClick={() => setShowEditForm(false)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Resume Score Section */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium mr-3">
                          100%
                        </div>
                        <span className="text-gray-600">Your resume score</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Improve resume
                      </Button>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-gray-800">
                          Tailor this resume for the job, and get more
                          interviews
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-600"
                      >
                        Try it
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editModalType === "summary"
                ? "Professional Summary"
                : editModalType === "jobDescription"
                  ? "Job Description"
                  : "Achievement"}
            </DialogTitle>
            <DialogDescription>
              Edit your content directly or use AI to improve or generate new
              content. Compare changes before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 h-96">
            {/* Original content */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Original</Label>
              <Textarea
                value={modalOriginalText}
                readOnly
                rows={8}
                className="bg-gray-50 text-gray-600 text-sm resize-none h-full"
                placeholder="Original content will appear here..."
              />
            </div>

            {/* Edited content */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Edited</Label>
              <Textarea
                value={modalEditedText}
                onChange={(e) => setModalEditedText(e.target.value)}
                rows={8}
                className="text-sm resize-none h-full"
                placeholder="Edit your content here..."
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={() => handleModalAI("improve")}
                disabled={modalIsProcessing}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                {modalIsProcessing ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                ) : (
                  <Edit className="w-3 h-3 mr-1" />
                )}
                Improve with AI
              </Button>
              <Button
                onClick={() => handleModalAI("generate")}
                disabled={modalIsProcessing}
                size="sm"
                variant="outline"
                className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100"
              >
                {modalIsProcessing ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Generate with AI
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={closeEditModal}
                variant="outline"
                size="sm"
                disabled={modalIsProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleModalSave}
                size="sm"
                disabled={modalIsProcessing}
              >
                <Save className="w-3 h-3 mr-1" />
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
    </div>
  );
}
