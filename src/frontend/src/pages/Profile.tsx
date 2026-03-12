import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Edit2, Save, Upload, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";

const PROFILE_FIELDS: { key: keyof UserProfile; label: string }[] = [
  { key: "name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "dateOfBirth", label: "Date of Birth" },
];

export default function Profile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(
    null,
  );
  const [idFile, setIdFile] = useState<File | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => actor!.getProfile(),
    enabled: !!actor,
  });

  const updateMut = useMutation({
    mutationFn: (p: UserProfile) => actor!.updateProfile(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
      setEditing(false);
      setIdFile(null);
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const handleEdit = () => {
    if (profile) {
      setForm({ ...profile });
      setOriginalProfile({ ...profile });
    }
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(null);
    setIdFile(null);
  };

  const sensitiveChanged =
    form &&
    originalProfile &&
    (form.name !== originalProfile.name ||
      form.address !== originalProfile.address ||
      form.dateOfBirth !== originalProfile.dateOfBirth);

  const handleSave = () => {
    if (!form) return;
    if (sensitiveChanged && !idFile) {
      toast.error("Please upload ID proof for sensitive field changes");
      return;
    }
    updateMut.mutate(sensitiveChanged ? { ...form, kycStatus: false } : form);
  };

  if (isLoading)
    return (
      <div data-ocid="profile.page" className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );

  const displayProfile = editing ? form : profile;

  return (
    <div data-ocid="profile.page" className="space-y-4 max-w-2xl">
      {profile && !profile.kycStatus && profile.idProofBlobId && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              KYC Pending Approval
            </p>
            <p className="text-xs text-yellow-700">
              Your ID document is under review. Profile changes restricted until
              approved.
            </p>
          </div>
          <Badge className="ml-auto bg-yellow-100 text-yellow-700 border border-yellow-300">
            Pending
          </Badge>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Information
          </CardTitle>
          {!editing ? (
            <Button
              size="sm"
              variant="outline"
              data-ocid="profile.edit.button"
              onClick={handleEdit}
            >
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                data-ocid="profile.save.button"
                onClick={handleSave}
                disabled={updateMut.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {updateMut.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROFILE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label
                  htmlFor={`profile-${key}`}
                  className="text-xs font-medium text-muted-foreground mb-1 block"
                >
                  {label}
                </label>
                {editing ? (
                  <Input
                    id={`profile-${key}`}
                    value={(form?.[key] as string) || ""}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, [key]: e.target.value } : f))
                    }
                    data-ocid={`profile.${key}.input`}
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {(displayProfile?.[key] as string) || "—"}
                  </p>
                )}
              </div>
            ))}

            <div className="sm:col-span-2">
              <label
                htmlFor="profile-address"
                className="text-xs font-medium text-muted-foreground mb-1 block"
              >
                Address
              </label>
              {editing ? (
                <Textarea
                  id="profile-address"
                  value={form?.address || ""}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, address: e.target.value } : f))
                  }
                  rows={2}
                  data-ocid="profile.address.textarea"
                />
              ) : (
                <p className="text-sm font-medium">
                  {displayProfile?.address || "—"}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="profile-preferences"
                className="text-xs font-medium text-muted-foreground mb-1 block"
              >
                Preferences
              </label>
              {editing ? (
                <Textarea
                  id="profile-preferences"
                  value={form?.preferences || ""}
                  onChange={(e) =>
                    setForm((f) =>
                      f ? { ...f, preferences: e.target.value } : f,
                    )
                  }
                  rows={2}
                  placeholder="e.g. Notifications: email, Language: English"
                  data-ocid="profile.preferences.textarea"
                />
              ) : (
                <p className="text-sm font-medium">
                  {displayProfile?.preferences || "—"}
                </p>
              )}
            </div>
          </div>

          {editing && sensitiveChanged && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                You've changed sensitive fields. Please upload an ID proof
                document.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  data-ocid="profile.upload_button"
                  onClick={() => document.getElementById("id-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {idFile ? idFile.name : "Upload ID Proof"}
                </Button>
                <input
                  id="id-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                />
              </div>
              {idFile && (
                <p className="text-xs text-yellow-700 mt-1">
                  Selected: {idFile.name}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
