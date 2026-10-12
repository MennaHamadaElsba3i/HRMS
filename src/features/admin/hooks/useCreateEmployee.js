import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEmployee } from "../api";

export const useCreateEmployee = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeData, lang }) => createEmployee(employeeData, lang),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

export default useCreateEmployee;
