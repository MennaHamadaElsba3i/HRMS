import { useMutation } from "@tanstack/react-query";

import { resendOTP } from "../api";

export const useResendOTP = () => {
  return useMutation({
    mutationFn: resendOTP,
  });
};
