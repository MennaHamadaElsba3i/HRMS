import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEmployee } from "../api/employeesApi";

export const useDeleteEmployee = (lang = "en") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteEmployee(id, lang),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["manager-employees"] });
      queryClient.removeQueries({ queryKey: ["employee", id] });
    },
  });
};

export default useDeleteEmployee;