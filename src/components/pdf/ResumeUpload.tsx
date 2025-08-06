import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Save, X, Edit, Check, Plus, Trash2 } from 'lucide-react';
import StructuredResumePreview from '@/components/structured-resume-preview';
import { GooglePlacesAutocomplete } from '@/components/AutoComplete';
import SimpleDatePicker from '@/components/ui/UnifiedDatePicker';

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
}

export default function ResumeUpload({
  onResumeUploaded,
  currentResume,
}: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedResume | null>(currentResume || null);
  const [editableData, setEditableData] = useState<ParsedResume | null>(currentResume || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load cached resume on mount
  useEffect(() => {
    const cached = localStorage.getItem('parsedResumeData');
    if (cached && !parsedData) {
      try {
        const data = JSON.parse(cached);
        setParsedData(data);
        setEditableData(data);
        onResumeUploaded?.(data);
      } catch (error) {
        console.error('Error loading cached resume:', error);
      }
    }
  }, [parsedData, onResumeUploaded]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setParsingProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setParsingProgress('Parsing resume...');
      setIsParsing(true);

      const response = await fetch('/api/resume?action=upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setParsedData(result.data);
        setEditableData(result.data);
        localStorage.setItem('parsedResumeData', JSON.stringify(result.data));
        onResumeUploaded?.(result.data);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      setParsingProgress('');
    }
  };

  const handleTextSubmit = async () => {
    if (!resumeText.trim()) return;

    setIsParsing(true);
    setParsingProgress('Processing text...');

    try {
      const response = await fetch('/api/resume?action=upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumeText }),
      });

      if (!response.ok) {
        throw new Error('Failed to process text');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setParsedData(result.data);
        setEditableData(result.data);
        localStorage.setItem('parsedResumeData', JSON.stringify(result.data));
        onResumeUploaded?.(result.data);
        setResumeText('');
        setShowTextInput(false);
      }
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsParsing(false);
      setParsingProgress('');
    }
  };

  const handleResumeImprove = (improvedData: any) => {
    const convertedData: ParsedResume = {
      summary: improvedData.summary || "",
      skills: improvedData.skills || [],
      experience: improvedData.experience || [],
      education: improvedData.education || [],
      contact: improvedData.contact || {},
      ats_score: improvedData.ats_score || "",
      ats_recommendations: improvedData.ats_recommendations || [],
      tailoring_notes: improvedData.tailoring_notes,
    };
    setParsedData(convertedData);
    localStorage.setItem('parsedResumeData', JSON.stringify(convertedData));
    onResumeUploaded?.(convertedData);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditableData(parsedData);
  };

  const saveEdits = () => {
    if (editableData) {
      setParsedData(editableData);
      localStorage.setItem('parsedResumeData', JSON.stringify(editableData));
      onResumeUploaded?.(editableData);
      setIsEditing(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditableData(parsedData);
  };

  const clearResume = () => {
    setParsedData(null);
    setEditableData(null);
    setResumeText('');
    setShowTextInput(false);
    setIsEditing(false);
    localStorage.removeItem('parsedResumeData');
    onResumeUploaded?.(null);
  };

  // Loading state
  if (isUploading || isParsing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">
              {parsingProgress || "Processing..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show parsed resume or edit form
  if (parsedData) {
    if (isEditing && editableData) {
      return (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Edit Resume</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={saveEdits} variant="default" size="sm">
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={cancelEditing} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Edit Form */}
            <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editableData.summary || ''}
                  onChange={(e) => setEditableData({...editableData, summary: e.target.value})}
                  placeholder="Professional summary..."
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editableData.skills?.join(', ') || ''}
                  onChange={(e) => setEditableData({
                    ...editableData, 
                    skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="JavaScript, React, Node.js, etc."
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={editableData.contact?.firstName || ''}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        contact: {...editableData.contact, firstName: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={editableData.contact?.lastName || ''}
                      onChange={(e) => setEditableData({
                        ...editableData,
                        contact: {...editableData.contact, lastName: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editableData.contact?.email || ''}
                    onChange={(e) => setEditableData({
                      ...editableData,
                      contact: {...editableData.contact, email: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editableData.contact?.phone || ''}
                    onChange={(e) => setEditableData({
                      ...editableData,
                      contact: {...editableData.contact, phone: e.target.value}
                    })}
                  />
                </div>
                      <div>
                       <Label>Location</Label>
                       <GooglePlacesAutocomplete
                         value={editableData.contact?.location || ''}
                         onChange={(value) => setEditableData({
                           ...editableData,
                           contact: {...editableData.contact, location: value}
                         })}
                         placeholder="Enter your location..."
                       />
                     </div>
                </CardContent>
             </Card>

             {/* Experience */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Work Experience</CardTitle>
               </CardHeader>
               <CardContent>
                 {editableData.experience?.map((exp, index) => (
                   <div key={index} className="border rounded-lg p-4 mb-4 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Company</Label>
                         <Input
                           value={exp.company || ''}
                           onChange={(e) => {
                             const newExp = [...editableData.experience];
                             newExp[index] = { ...exp, company: e.target.value };
                             setEditableData({ ...editableData, experience: newExp });
                           }}
                         />
                       </div>
                       <div>
                         <Label>Role</Label>
                         <Input
                           value={exp.role || ''}
                           onChange={(e) => {
                             const newExp = [...editableData.experience];
                             newExp[index] = { ...exp, role: e.target.value };
                             setEditableData({ ...editableData, experience: newExp });
                           }}
                         />
                       </div>
                     </div>
                                           <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Date</Label>
                          <SimpleDatePicker
                            value={exp.startDate}
                            onChange={(date: Date | undefined) => {
                              const newExp = [...editableData.experience];
                              newExp[index] = { ...exp, startDate: date };
                              setEditableData({ ...editableData, experience: newExp });
                            }}
                            placeholder="Start date"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <SimpleDatePicker
                            value={exp.endDate}
                            onChange={(date: Date | undefined) => {
                              const newExp = [...editableData.experience];
                              newExp[index] = { ...exp, endDate: date };
                              setEditableData({ ...editableData, experience: newExp });
                            }}
                            placeholder="End date (optional)"
                          />
                        </div>
                      </div>
                                           <div>
                        <Label>Location</Label>
                        <GooglePlacesAutocomplete
                          value={exp.location || ''}
                          onChange={(value) => {
                            const newExp = [...editableData.experience];
                            newExp[index] = { ...exp, location: value };
                            setEditableData({ ...editableData, experience: newExp });
                          }}
                          placeholder="Enter company location..."
                        />
                      </div>
                     <div>
                       <Label>Job Description</Label>
                       <Textarea
                         value={exp.description || ''}
                         onChange={(e) => {
                           const newExp = [...editableData.experience];
                           newExp[index] = { ...exp, description: e.target.value };
                           setEditableData({ ...editableData, experience: newExp });
                         }}
                         placeholder="• Led development of new features for mobile app
• Managed team of 5 developers across 3 projects  
• Improved application performance by 40%
• Implemented CI/CD pipeline reducing deployment time by 60%"
                         className="min-h-[120px]"
                       />
                     </div>
                     <Button
                       onClick={() => {
                         const newExp = editableData.experience.filter((_, i) => i !== index);
                         setEditableData({ ...editableData, experience: newExp });
                       }}
                       variant="outline"
                       size="sm"
                       className="text-red-600 hover:text-red-700"
                     >
                       <Trash2 className="w-4 h-4 mr-2" />
                       Remove Experience
                     </Button>
                   </div>
                 ))}
                 <Button
                   onClick={() => {
                     const newExp = [...(editableData.experience || []), {
                       company: '',
                       role: '',
                       duration: '',
                       startDate: new Date(),
                       endDate: undefined,
                       isCurrentRole: false,
                       location: '',
                       description: '',
                       achievements: [],
                       responsibilities: [],
                       keywords: []
                     }];
                     setEditableData({ ...editableData, experience: newExp });
                   }}
                   variant="outline"
                   size="sm"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Add Experience
                 </Button>
               </CardContent>
             </Card>

             {/* Education */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Education</CardTitle>
               </CardHeader>
               <CardContent>
                 {editableData.education?.map((edu, index) => (
                   <div key={index} className="border rounded-lg p-4 mb-4 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Institution</Label>
                         <Input
                           value={edu.institution || ''}
                           onChange={(e) => {
                             const newEdu = [...editableData.education];
                             newEdu[index] = { ...edu, institution: e.target.value };
                             setEditableData({ ...editableData, education: newEdu });
                           }}
                         />
                       </div>
                       <div>
                         <Label>Degree</Label>
                         <Input
                           value={edu.degree || ''}
                           onChange={(e) => {
                             const newEdu = [...editableData.education];
                             newEdu[index] = { ...edu, degree: e.target.value };
                             setEditableData({ ...editableData, education: newEdu });
                           }}
                         />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Field of Study</Label>
                         <Input
                           value={edu.field || ''}
                           onChange={(e) => {
                             const newEdu = [...editableData.education];
                             newEdu[index] = { ...edu, field: e.target.value };
                             setEditableData({ ...editableData, education: newEdu });
                           }}
                         />
                       </div>
                       <div>
                         <Label>Year</Label>
                         <Input
                           value={edu.year || ''}
                           onChange={(e) => {
                             const newEdu = [...editableData.education];
                             newEdu[index] = { ...edu, year: e.target.value };
                             setEditableData({ ...editableData, education: newEdu });
                           }}
                         />
                       </div>
                     </div>
                                           <div>
                        <Label>Location</Label>
                        <GooglePlacesAutocomplete
                          value={edu.location || ''}
                          onChange={(value) => {
                            const newEdu = [...editableData.education];
                            newEdu[index] = { ...edu, location: value };
                            setEditableData({ ...editableData, education: newEdu });
                          }}
                          placeholder="Enter institution location..."
                        />
                      </div>
                     <Button
                       onClick={() => {
                         const newEdu = editableData.education.filter((_, i) => i !== index);
                         setEditableData({ ...editableData, education: newEdu });
                       }}
                       variant="outline"
                       size="sm"
                       className="text-red-600 hover:text-red-700"
                     >
                       <Trash2 className="w-4 h-4 mr-2" />
                       Remove Education
                     </Button>
                   </div>
                 ))}
                 <Button
                   onClick={() => {
                     const newEdu = [...(editableData.education || []), {
                       institution: '',
                       degree: '',
                       field: '',
                       year: '',
                       graduationDate: new Date(),
                       location: '',
                       gpa: '',
                       honors: ''
                     }];
                     setEditableData({ ...editableData, education: newEdu });
                   }}
                   variant="outline"
                   size="sm"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Add Education
                 </Button>
               </CardContent>
             </Card>
           </div>
           </CardContent>
         </Card>
       );
     }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Resume Uploaded</h2>
          <div className="flex space-x-2">
            <Button onClick={startEditing} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={clearResume} variant="outline" size="sm">
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
        <StructuredResumePreview 
          resumeData={parsedData} 
          onImprove={handleResumeImprove}
        />
      </div>
    );
  }

  // Upload interface
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <span>Upload Resume</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
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
                Drag and drop your PDF or DOCX file here, or click to browse
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
              onClick={() => document.getElementById("resume-file")?.click()}
              className="mx-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>

        {/* Manual Entry */}
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
              disabled={!resumeText.trim()}
            >
              <FileText className="w-4 h-4 mr-2" />
              Process Resume
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
