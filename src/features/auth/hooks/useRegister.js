import { useMutation } from "@tanstack/react-query";

import { registerUser } from "../api";

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
  });
};
