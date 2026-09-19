export type FormState = {
  success?: boolean;
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
};
