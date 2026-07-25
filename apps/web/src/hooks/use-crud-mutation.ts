import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseCrudMutationOptions<TData, TError, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: unknown[][];
  successMessage: string;
  errorMessage: string;
  onSuccess?: (data: TData) => void;
}

export function useCrudMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>({
  mutationFn,
  invalidateKeys,
  successMessage,
  errorMessage,
  onSuccess: onSuccessCallback,
}: UseCrudMutationOptions<TData, TError, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: (data: TData) => {
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      toast.success(successMessage);
      onSuccessCallback?.(data);
    },
    onError: () => {
      toast.error(errorMessage);
    },
  });
}
