import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

export const useProfile = (employeeId = null) => {
  const queryClient = useQueryClient();
  const { i18n, t } = useTranslation();
  const { setCurrentUser, currentUser } = useAuth();

  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  const activeId = employeeId ?? currentUser?.id ?? currentUser?.userId;

  // Query for fetching employee/user profile
  const profileQuery = useQuery({
    queryKey: ["employee", activeId, lang],
    queryFn: () => getProfile(activeId, lang),
    enabled: Boolean(activeId),
    retry: 1,
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: (formData) => updateProfile(formData, lang),
    onSuccess: (data) => {
      const updatedUser = data?.data || data?.user || data;

      toast.success(
        data?.message ||
          t("profileSettingsPage.updateSuccess", "Profile updated successfully"),
      );

      if (updatedUser && typeof updatedUser === "object" && setCurrentUser) {
        setCurrentUser({
          ...currentUser,
          ...updatedUser,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["employee"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        t("profileSettingsPage.updateError", "Failed to update profile");
      toast.error(message);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
};

export default useProfile;
