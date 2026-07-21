import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Star, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Edit, 
  Save,
  Award,
  GraduationCap,
  Languages,
  Loader2,
  UserCog,
  ArrowRight
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import api from "@/lib/api";
import { useProfile } from "@/contexts/ProfileContext";
import { useProfileCompletion } from "@/contexts/ProfileCompletionContext";

const mockProfile = {
  name: "Writer Name",
  avatar: "",
  rating: 4.9,
  totalOrders: 10,
  completedOrders: 8,
  successRate: 96.5,
  earnings: 550,
  level: "Expert Writer",
  specializations: ["Academic Writing", "Research Papers", "Essays", "Business Writing"],
  languages: ["English (Native)", "Spanish (Fluent)", "French (Intermediate)"],
  education: ["PhD in English Literature - Harvard University", "MA in Creative Writing - Columbia"],
  experience: "8+ years of professional academic writing",
  description: "Experienced academic writer specializing in literature, research methodologies, and critical analysis. I have successfully completed over 1200 orders with a 96.5% satisfaction rate.",
  subjects: ["Literature", "History", "Psychology", "Business Studies", "Philosophy"]
};

interface WriterProfileProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WriterProfile({ isOpen, onOpenChange }: WriterProfileProps = {}) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(mockProfile);
  const [internalOpen, setInternalOpen] = useState(false);

  const dialogOpen = isOpen !== undefined ? isOpen : internalOpen;
  const setDialogOpen = onOpenChange || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profileCompletion, refreshProfile, openWizard } = useProfileCompletion();



  useEffect(() => {
    if (!dialogOpen) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get("/profile");

        console.log(res.data);
        const { user, writer_profile, metrics, profile_completion } = res.data;

        const API_ORIGIN = api.defaults.baseURL?.replace("/api/v1", "");

        setProfile({
          name: user.full_name,
          avatar: user.profile_image
            ? `${API_ORIGIN}/api/v1/profile/images/${user.profile_image}`
            : "",
          rating: metrics.rating,
          totalOrders: metrics.total_orders,
          completedOrders: metrics.completed_orders,
          successRate: metrics.success_rate,
          earnings: metrics.earnings,
          level: user.level ?? "Writer",
          specializations: writer_profile?.specializations ?? [],
          languages: (writer_profile?.languages ?? []).map(
            (l) => `${l.language} (${l.proficiency})`
          ),
          education: writer_profile?.education ?? [],
          experience: "",
          description: writer_profile?.bio ?? "",
          subjects: writer_profile?.subjects ?? [],
        });

        if (profile_completion) refreshProfile();
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [dialogOpen]);


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Writer Profile
            {/* Show Edit button only if profile is complete and not loading */}
            {/*{!loading && profileCompletion?.is_complete && (
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                disabled={true}
                onClick={() => openWizard()}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}*/}
          </DialogTitle>
        </DialogHeader>

        {/* Show loader first */}
        {loading || !profileCompletion ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : !profileCompletion?.is_complete ? (
          // Show "Complete Profile" card only if profile is incomplete
          <div className="flex items-center justify-center min-h-full p-4">
            <Card className="max-w-lg w-full border">
              <CardHeader className="text-center">
                <UserCog className="mx-auto h-10 w-10 text-primary mb-3" />
                <CardTitle>Complete Your Profile</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center">
                  Finish setting up your profile to unlock available orders.
                </p>

                <Button className="w-full" onClick={() => openWizard()}>
                  Complete Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Full profile content (profile is complete)
          <div className="grid gap-6">
            {/* Header Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-20 w-20 shrink-0">
                    <AvatarImage
                      src={profile.avatar}
                      alt={profile.name}
                      onError={(e) => (e.currentTarget.src = "")}
                      className="object-cover object-center"
                    />
                    <AvatarFallback className="text-lg">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {isEditing ? (
                        <Input
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                          }
                          className="text-xl font-bold"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold">{profile.name}</h2>
                      )}
                      <Badge
                        variant="secondary"
                        className="bg-brand-primary/10 text-brand-primary"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {profile.level}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                        {profile.rating} Rating
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {profile.totalOrders} Orders
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {profile.successRate}% Success Rate
                      </div>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={profile.description}
                        onChange={(e) =>
                          setProfile({ ...profile, description: e.target.value })
                        }
                        rows={3}
                      />
                    ) : (
                      <p className="text-muted-foreground">{profile.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid of Stats, Specializations, Education, Languages */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-semibold">{profile.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-semibold text-success">{profile.completedOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-semibold">{profile.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="font-semibold text-brand-primary">${profile.earnings.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Specializations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Specializations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((spec, idx) => (
                      <Badge key={idx} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-muted-foreground">
                        {edu.institution} • {edu.year}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Languages className="h-5 w-5 mr-2" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.languages.map((lang, idx) => (
                    <p key={idx} className="text-sm">{lang}</p>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subject Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((subject, idx) => (
                    <Badge key={idx} variant="outline">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}