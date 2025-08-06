"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GooglePlacesAutocomplete } from "@/components/AutoComplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Building,
  Clock,
  Users,
  Award,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  posted: string;
  salary?: string;
  type: string;
  source: string;
  tags?: string[];
  // Additional JSearch fields
  employer_logo?: string;
  job_employment_type?: string;
  job_employment_types?: string[];
  job_apply_link?: string;
  job_google_link?: string;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_is_remote?: boolean;
  job_city?: string;
  job_state?: string;
  job_country?: string;
}

interface JobSearchProps {
  onJobSelect?: (job: Job) => void;
}

export default function JobSearch({ onJobSelect }: JobSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("Software Engineer");
  const [location, setLocation] = useState("New York, NY");
  const [jobType, setJobType] = useState("");
  const [radius, setRadius] = useState("25");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);

  // Auto-search on component mount with default values
  useEffect(() => {
    if (searchQuery && location) {
      handleSearch();
    }
  }, []); // Only run on mount

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title, skill, or company name.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        location: location,
        radius: radius,
        jobtype: jobType === "all" ? "" : jobType,
        limit: "20",
      });

      const response = await fetch(`/api/jobs/search?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setSearchResults(data);

      toast({
        title: "Search completed",
        description: `Found ${data.jobs?.length || 0} job opportunities.`,
      });
    } catch (error) {
      console.error("Job search error:", error);

      // More specific error handling
      let errorMessage =
        "There was an error searching for jobs. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Search is taking longer than expected. Please try again.";
        }
      }

      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty results on error
      setJobs([]);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, location, jobType, radius, toast]);

  const handleJobClick = (job: Job) => {
    if (onJobSelect) {
      onJobSelect(job);
    } else {
      // Open job URL in new tab
      window.open(job.url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Job Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Job Title, Skills, or Company
              </label>
              <Input
                placeholder="e.g. Software Engineer, React, Google"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <GooglePlacesAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="City, State, or Remote"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Type</label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="All job types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All job types</SelectItem>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Radius</label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Exact location</SelectItem>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({jobs.length} jobs found)</CardTitle>
            {searchResults.query && (
              <p className="text-sm text-gray-600">
                Showing results for "{searchResults.query}"
                {searchResults.location && ` in ${searchResults.location}`}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-blue-700 hover:text-blue-800 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center text-gray-700 mb-2">
                            <Building className="w-5 h-5 mr-2" />
                            <span className="font-semibold text-lg">
                              {job.company}
                            </span>
                            {job.employer_logo && (
                              <img
                                src={job.employer_logo}
                                alt={`${job.company} logo`}
                                className="w-6 h-6 ml-3 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge
                            variant="outline"
                            className="bg-green-50 border-green-200 text-green-800"
                          >
                            {job.source}
                          </Badge>
                          {job.job_is_remote && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-800"
                            >
                              Remote
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                          <span>
                            {job.job_city && job.job_state
                              ? `${job.job_city}, ${job.job_state}`
                              : job.location}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-green-500" />
                          <span>
                            {job.job_posted_at_datetime_utc
                              ? new Date(
                                  job.job_posted_at_datetime_utc,
                                ).toLocaleDateString()
                              : job.posted}
                          </span>
                        </div>
                        {job.job_min_salary && job.job_max_salary ? (
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-yellow-500" />
                            <span className="font-semibold text-green-700">
                              ${Math.round(job.job_min_salary / 1000)}k-$
                              {Math.round(job.job_max_salary / 1000)}k
                              {job.job_salary_period &&
                                ` ${job.job_salary_period}`}
                            </span>
                          </div>
                        ) : (
                          job.salary && (
                            <div className="flex items-center text-gray-600">
                              <DollarSign className="w-4 h-4 mr-2 text-yellow-500" />
                              <span className="font-semibold text-green-700">
                                {job.salary}
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Employment Types */}
                      <div className="flex items-center space-x-2 mb-4">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Employment:
                        </span>
                        {job.job_employment_types?.map((type, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {type
                              .replace("FULLTIME", "Full-time")
                              .replace("PARTTIME", "Part-time")
                              .replace("CONTRACTOR", "Contract")}
                          </Badge>
                        )) || (
                          <Badge variant="secondary" className="text-xs">
                            {job.type}
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {job.description?.length > 200
                            ? `${job.description.substring(0, 200)}...`
                            : job.description}
                        </p>
                      </div>

                      {/* Job Highlights */}
                      {job.job_highlights && (
                        <div className="mb-4 space-y-3">
                          {job.job_highlights.Qualifications &&
                            job.job_highlights.Qualifications.length > 0 && (
                              <div>
                                <div className="flex items-center mb-2">
                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    Key Qualifications:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {job.job_highlights.Qualifications.slice(
                                    0,
                                    3,
                                  ).map((qual, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs bg-blue-50 border-blue-200 text-blue-800"
                                    >
                                      {qual.length > 50
                                        ? `${qual.substring(0, 50)}...`
                                        : qual}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                          {job.job_highlights.Benefits &&
                            job.job_highlights.Benefits.length > 0 && (
                              <div>
                                <div className="flex items-center mb-2">
                                  <Award className="w-4 h-4 mr-2 text-green-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    Benefits:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {job.job_highlights.Benefits.slice(0, 2).map(
                                    (benefit, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs bg-green-50 border-green-200 text-green-800"
                                      >
                                        {benefit.length > 40
                                          ? `${benefit.substring(0, 40)}...`
                                          : benefit}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Action Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          {job.tags?.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center text-blue-600 font-medium text-sm">
                          <span className="mr-2">View Details</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {jobs.length === 0 && !isSearching && searchResults && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No jobs found for your search criteria.</p>
                    <p className="text-sm">
                      Try adjusting your search terms or location.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Live Data Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-green-800">
                Live Job Search Active
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Connected to Indeed, LinkedIn, Glassdoor and other major job
                boards via RapidAPI JSearch. Showing real-time job postings with
                full details, salary ranges, and company information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
