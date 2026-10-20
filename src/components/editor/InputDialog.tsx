import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "./OutputPanel";

export function InputDialog({
  open,
  onOpenChange,
  inputCalls,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputCalls: number;
  initial: string;
  onSubmit: (stdin: string) => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg">
        <DialogHeader className="text-left">
          <p className="label-mono text-primary">Console.ReadLine()</p>
          <DialogTitle className="tracking-tight">Este programa pede dados</DialogTitle>
          <DialogDescription>
            Escreva uma resposta por linha, pela ordem em que o programa as pede
            {inputCalls > 0 ? ` (${inputCalls} leitura(s) no código)` : ""}.
          </DialogDescription>
        </DialogHeader>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              onSubmit(value);
            }
          }}
          spellCheck={false}
          rows={6}
          placeholder={"Primeira resposta\nSegunda resposta\n…"}
          className="w-full resize-none rounded-md border border-input bg-terminal p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring"
        />
        <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> para executar
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => onSubmit("")}>
              Executar sem dados
            </Button>
            <Button variant="run" onClick={() => onSubmit(value)}>
              <Play /> Executar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
