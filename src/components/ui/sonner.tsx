import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-0 group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:shadow-sheet",
          description: "group-[.toast]:text-background/70",
          actionButton: "group-[.toast]:!rounded-full group-[.toast]:!bg-transparent group-[.toast]:!font-semibold group-[.toast]:!text-primary",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
