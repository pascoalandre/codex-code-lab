import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;

export const projectsQuery = () =>
  queryOptions({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["projects", id],
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export async function createProject(input: { name: string; code: string; stdin?: string | undefined; description?: string | null | undefined }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Precisa de iniciar sessão.");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: auth.user.id,
      name: input.name.trim() || "Sem título",
      code: input.code,
      stdin: input.stdin ?? "",
      description: input.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, patch: Partial<Pick<Project, "name" | "code" | "stdin" | "description" | "is_favorite">>) {
  const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export const BLANK_TEMPLATE = `using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Olá do C# Codex!");
    }
}
`;
