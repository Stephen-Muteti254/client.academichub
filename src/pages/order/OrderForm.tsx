import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { orderFormSchema, OrderFormValues } from "./schema";
import { AttachedFile, PreferredWriter } from "./types";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// UI imports (UNCHANGED)
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, FileText, DollarSign, Calendar, Tag, Users } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  mode: "create" | "edit";
  orderId?: string;
  initialData?: any;
}

export default function OrderForm({ mode, orderId, initialData }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEditing = mode === "edit";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [preferredWriters, setPreferredWriters] = useState<PreferredWriter[]>([]);
  const [minimumBudget, setMinimumBudget] = useState<number | null>(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);

  const [tagInput, setTagInput] = useState("");
  const [writerInput, setWriterInput] = useState("");

  const [pricingValues, setPricingValues] = useState({
    category: "",
    orderType: "",
    pages: "",
    deadline: ""
  });

  const [writerLookup, setWriterLookup] = useState<{
    loading: boolean;
    results: Array<{ id: string; name: string; avatar?: string }>;
    error?: string;
  }>({ loading: false, results: [] });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      orderType: "",
      budget: "",
      deadline: "",
      pages: "",
      format: "",
      citationStyle: "",
      language: "en-us",
      additionalNotes: "",
    },
  });



  useEffect(() => {
    const subscription = form.watch((values) => {
      setPricingValues({
        category: values.category,
        orderType: values.orderType,
        pages: values.pages,
        deadline: values.deadline,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);


  useEffect(() => {
    const { category, orderType, pages, deadline } = pricingValues;

    if (!category || !orderType || !deadline) {
      setMinimumBudget(null);
      setIsBudgetLoading(false);
      return;
    }

    const delay = setTimeout(async () => {
      setIsBudgetLoading(true);
      try {
        const res = await api.post("/orders/pricing/preview", {
          category,
          orderType,
          pages: Number(pages || 1),
          deadline,
        });

        setMinimumBudget(res.data.min_budget ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsBudgetLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [pricingValues]);



  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addWriter = () => {
    if (!writerInput.trim()) return;

    if (!preferredWriters.find((w) => w.name === writerInput.trim())) {
      setPreferredWriters([
        ...preferredWriters,
        { id: writerInput.trim(), name: writerInput.trim() },
      ]);
    }

    setWriterInput("");
  };

  const removeWriter = (writerId: string) => {
    setPreferredWriters((prev) =>
      prev.filter((w) => w.id !== writerId)
    );
  };

  useEffect(() => {
    const fetchWriter = async () => {
    if (!writerInput.trim()) {
      setWriterLookup({ loading: false, results: [] });
      return;
    }

    setWriterLookup({ loading: true, results: [] });
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(writerInput.trim())}`);
      const results = res.data?.results || [];
      setWriterLookup({ loading: false, results });
    } catch (err: any) {
      setWriterLookup({
        loading: false,
        results: [],
        error: "No writers found",
      });
    }
  };
    // debounce (wait for user to stop typing)
    const delay = setTimeout(fetchWriter, 500);
    return () => clearTimeout(delay);
  }, [writerInput]);

  // -------------------------------
  // INITIAL DATA (EDIT MODE)
  // -------------------------------
  useEffect(() => {
    if (!initialData) return;

    form.reset({
      title: initialData.title ?? "",
      description: initialData.description ?? "",
      category: initialData.subject || "",
      orderType: initialData.type || "",
      budget: initialData.budget ? String(initialData.budget) : "",
      deadline: initialData.deadline?.slice(0, 16) ?? "",
      pages: initialData.pages ? String(initialData.pages) : "",
      format: initialData.format || "",
      citationStyle: initialData.citation_style || "",
      language: initialData.language || "en-us",
      additionalNotes: initialData.additional_notes || "",
    });

    setTags(initialData.tags || []);
    setPreferredWriters(initialData.preferred_writers || []);

    setAttachedFiles(
      (initialData.files || []).map((f: any, i: number) => ({
        id: `existing-${i}`,
        name: f.url?.split("/").pop(),
        size: f.size || 0,
        url: f.url,
      }))
    );
  }, [initialData]);

  // -------------------------------
  // FILE HANDLING
  // -------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map((file) => ({
      id: Math.random().toString(36),
      file,
      name: file.name,
      size: file.size,
    }));

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([k, v]) => {
        if (v) formData.append(k, v.toString());
      });

      tags.forEach((t, i) => formData.append(`tags[${i}]`, t));
      preferredWriters.forEach((w, i) =>
        formData.append(`preferred_writers[${i}]`, w.id)
      );

      attachedFiles.forEach((f) => {
        if (f.file) formData.append("attachedFiles", f.file);
        if (f.url) formData.append("existingFiles", f.url);
      });

      const url = isEditing ? `/orders/${orderId}` : "/orders";
      const method = isEditing ? api.patch : api.post;

      await method(url, formData);

      toast({
        title: isEditing ? "Order Updated Successfully!" : "Order Created Successfully!",
      });

      navigate("/client/orders");
    } catch (err: any) {
      console.log(err);
      toast({
        title: err.response?.data?.error?.code || "Error",
        description: err.response?.data?.error?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (id: string) => {
    setAttachedFiles(attachedFiles.filter(f => f.id !== id));
  };

  // -------------------------------
  // UI (UNCHANGED DESIGN)
  // -------------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-4 pr-2">
      <h1 className="text-2xl font-bold">
        {isEditing ? "Edit Order" : "Create New Order"}
      </h1>

      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Basic Information */}
            <Card className="border-border shadow-soft">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle>Project Details</CardTitle>
                </div>
                <CardDescription>
                  Provide a clear title and description of your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Comparative Literature Essay on Shakespeare"
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a clear overview of what you need..."
                          className="min-h-[200px] resize-none bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {field.value?.length || 0} / 50000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card className="border-border shadow-soft">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle>Specifications</CardTitle>
                <CardDescription>
                  Define technical requirements and formatting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(val) => field.onChange(val)}
                            onBlur={() => field.onBlur?.()}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accounting">Accounting</SelectItem>
                              <SelectItem value="american-government">American Government</SelectItem>
                              <SelectItem value="american-history">American History</SelectItem>
                              <SelectItem value="anatomy">Anatomy</SelectItem>
                              <SelectItem value="anthropology">Anthropology</SelectItem>
                              <SelectItem value="art">Art</SelectItem>
                              <SelectItem value="astronomy">Astronomy</SelectItem>
                              <SelectItem value="behavioural-science">Behavioural Science</SelectItem>
                              <SelectItem value="biology">Biology</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="chemistry">Chemistry</SelectItem>
                              <SelectItem value="computer-science">Computer Science</SelectItem>
                              <SelectItem value="criminology">Criminology</SelectItem>
                              <SelectItem value="cultural-studies">Cultural Studies</SelectItem>
                              <SelectItem value="cyber-security">Cyber Security</SelectItem>
                              <SelectItem value="data-analysis">Data Analysis</SelectItem>
                              <SelectItem value="data-science">Data Science</SelectItem>
                              <SelectItem value="economics">Economics</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="engineering">Engineering</SelectItem>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="environmental-science">Environmental Science</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="geography">Geography</SelectItem>
                              <SelectItem value="global-issues-disaster-management">Global Issues and Disaster Management</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="history">History</SelectItem>
                              <SelectItem value="journalism">Journalism</SelectItem>
                              <SelectItem value="law">Law</SelectItem>
                              <SelectItem value="linguistics">Linguistics</SelectItem>
                              <SelectItem value="literature">Literature</SelectItem>
                              <SelectItem value="management-strategic-leadership">Management and Strategic Leadership</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="mathematics">Mathematics</SelectItem>
                              <SelectItem value="medicine">Medicine</SelectItem>
                              <SelectItem value="nursing">Nursing</SelectItem>
                              <SelectItem value="philosophy">Philosophy</SelectItem>
                              <SelectItem value="physics">Physics</SelectItem>
                              <SelectItem value="political-science">Political Science</SelectItem>
                              <SelectItem value="programming">Programming</SelectItem>
                              <SelectItem value="psychology">Psychology</SelectItem>
                              <SelectItem value="public-administration">Public Administration</SelectItem>
                              <SelectItem value="religion-theology">Religion and Theology</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="sociology">Sociology</SelectItem>
                              <SelectItem value="statistics">Statistics</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="website-app-development">Website App Development</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || ""}
                            onValueChange={(val) => field.onChange(val)}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admission-essay">Admission Essay</SelectItem>
                              <SelectItem value="annotated-bibiliography">Annotated Bibiliography</SelectItem>
                              <SelectItem value="article-review">Article Review</SelectItem>
                              <SelectItem value="business-plan">Business Plan</SelectItem>
                              <SelectItem value="calculation">Calculation</SelectItem>
                              <SelectItem value="case-brief">Case Brief</SelectItem>
                              <SelectItem value="case-study">Case Study</SelectItem>
                              <SelectItem value="coding-project">Coding Project</SelectItem>
                              <SelectItem value="coursework">Coursework</SelectItem>
                              <SelectItem value="cover-letter">Cover Letter</SelectItem>
                              <SelectItem value="creative-writing">Creative Writing</SelectItem>
                              <SelectItem value="critical-thinking">Critical Thinking</SelectItem>
                              <SelectItem value="discussion-post">Discussion Post</SelectItem>
                              <SelectItem value="dissertation">Dissertation</SelectItem>
                              <SelectItem value="editing">Editing</SelectItem>
                              <SelectItem value="essay">Essay</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="lab-report">Lab Report</SelectItem>
                              <SelectItem value="marketing-plan">Marketing Plan</SelectItem>
                              <SelectItem value="online-test-exam">Online Test/Exam</SelectItem>
                              <SelectItem value="outline">Outline</SelectItem>
                              <SelectItem value="powerpoint-slides">Powerpoint/Slides</SelectItem>
                              <SelectItem value="presentation-speech">Presentation/Speech</SelectItem>
                              <SelectItem value="problem-solving">Problem Solving</SelectItem>
                              <SelectItem value="quizes">Quizes</SelectItem>
                              <SelectItem value="reflection">Reflection</SelectItem>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="research-paper">Research Paper</SelectItem>
                              <SelectItem value="resume">Resume</SelectItem>
                              <SelectItem value="rewriting">Rewriting</SelectItem>
                              <SelectItem value="synthesis-paper">Synthesis Paper</SelectItem>
                              <SelectItem value="term-paper">Term Paper</SelectItem>
                              <SelectItem value="thesis">Thesis</SelectItem>
                              <SelectItem value="design-drawing">Design/Drawing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pages <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 6"
                            min="1"
                            className="bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="docx">DOCX</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="pptx">PPTX</SelectItem>
                            <SelectItem value="xlsx">XLSX</SelectItem>
                            <SelectItem value="txt">TXT</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="citationStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Citation Style <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mla">MLA</SelectItem>
                            <SelectItem value="apa">APA</SelectItem>
                            <SelectItem value="chicago">Chicago</SelectItem>
                            <SelectItem value="harvard">Harvard</SelectItem>
                            <SelectItem value="ieee">IEEE</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en-us">English (US)</SelectItem>
                            <SelectItem value="en-uk">English (UK)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any specific instructions or preferences for the writer..."
                          className="min-h-[80px] resize-none bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {field.value?.length || 0} / 1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Budget & Timeline */}
            <Card className="border-border shadow-soft">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle>Budget & Timeline</CardTitle>
                <CardDescription>
                  Set your deadline and view the minimum required budget
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* DEADLINE FIELD FIRST */}
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="datetime-local"
                              className="pl-9 bg-background"
                              min={new Date().toISOString().slice(0, 16)}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* BUDGET FIELD */}
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-9 bg-background"
                              min="1"
                              step="0.01"
                              disabled={isBudgetLoading}   // DISABLE WHILE LOADING
                              {...field}
                            />
                          </div>
                        </FormControl>

                        <FormMessage />

                        {/* LOADING STATE */}
                        {isBudgetLoading && (
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <span className="animate-spin w-3 h-3 border-[2px] border-blue-600 border-t-transparent rounded-full" />
                            Calculating minimum budget...
                          </p>
                        )}

                        {/* MINIMUM BUDGET */}
                        {!isBudgetLoading && minimumBudget !== null && (
                          <p className="text-xs text-yellow-600">
                            Minimum budget required: <b>${minimumBudget}</b>
                          </p>
                        )}

                        {/* TOO LOW WARNING */}
                        {!isBudgetLoading &&
                          form.watch("budget") &&
                          minimumBudget &&
                          form.watch("budget") < minimumBudget && (
                            <p className="text-xs text-red-600">
                              Your budget is too low for this project.
                            </p>
                        )}
                      </FormItem>
                    )}
                  />

                </div>
              </CardContent>
            </Card>


            {/* Tags and Writers - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tags */}
              <Card className="border-border shadow-soft">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-lg">Tags <span className="text-muted-foreground font-normal text-sm">(Optional)</span></CardTitle>
                  <CardDescription className="text-xs">
                    Add keywords to help writers find your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Shakespeare, Drama"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="bg-background"
                    />
                    <Button 
                      type="button" 
                      onClick={addTag} 
                      variant="secondary"
                      size="icon"
                      className="shrink-0"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preferred Writers */}
              <Card className="border-border shadow-soft">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-lg">Preferred Writers <span className="text-muted-foreground font-normal text-sm">(Optional)</span></CardTitle>
                  <CardDescription className="text-xs">
                    Invite specific writers to bid on your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Enter writer ID or name"
                        value={writerInput}
                        onChange={(e) => setWriterInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addWriter();
                          }
                        }}
                        className="bg-background"
                      />
                      <Button 
                        type="button" 
                        onClick={addWriter} 
                        variant="secondary"
                        size="icon"
                        className="shrink-0"
                        disabled={!writerLookup.found}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Writer suggestions */}
                    {writerLookup.loading && (
                      <p className="text-xs text-muted-foreground">Searching...</p>
                    )}

                    {writerLookup.results.length > 0 && (
                      <div className="space-y-1 border rounded-md p-2 bg-muted/30">
                        {writerLookup.results.map((w) => (
                          <div
                            key={w.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => {
                              if (!preferredWriters.find((pw) => pw.id === w.id)) {
                                setPreferredWriters([...preferredWriters, { id: w.id, name: w.name ?? "Unknown" }]);
                              }
                              setWriterInput("");
                              setWriterLookup({ loading: false, results: [] });
                            }}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={w.avatar} alt={w.name} />
                              <AvatarFallback>{w.name?.[0] ?? "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{w.name}</span>
                              <span className="text-xs text-muted-foreground">{w.id}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {writerLookup.error && (
                      <p className="text-xs text-destructive">{writerLookup.error}</p>
                    )}

                  </div>
                  {preferredWriters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferredWriters.map(writer => (
                      <Badge key={writer.id} variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5">
                        {writer.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() =>
                            setPreferredWriters(preferredWriters.filter(w => w.id !== writer.id))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* File Attachments */}
            <Card className="border-border shadow-soft">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle>Attachments <span className="text-muted-foreground font-normal text-base">(Optional)</span></CardTitle>
                <CardDescription>
                  Upload reference materials, instructions, or templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/30">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1 text-foreground">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PDF, DOC, DOCX, TXT, images (max 10MB per file)
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  <Label htmlFor="file-upload">
                    <Button type="button" variant="secondary" size="sm" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </Label>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map(file => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            {file.url ? (
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium truncate text-foreground underline"
                              >
                                {file.name}
                              </a>
                            ) : (
                              <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="outline"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isEditing ? "Saving Changes..." : "Creating Order..."}
                  </>
                ) : (
                  isEditing ? "Save Changes" : "Create Order"
                )}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}