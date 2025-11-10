import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CategoryDialogProps {
  open: boolean;
  taskText: string;
  onSelectCategory: (category: 'personal' | 'health' | 'enterprises') => void;
  onCancel: () => void;
}

export const CategoryDialog = ({ open, taskText, onSelectCategory, onCancel }: CategoryDialogProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Which category for this task?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-foreground font-medium">"{taskText}"</p>
            <p>Malunita is not sure which category this task belongs to. Please choose:</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={() => onSelectCategory('personal')}
            variant="outline"
            className="w-full"
          >
            Personal
          </Button>
          <Button
            onClick={() => onSelectCategory('health')}
            variant="outline"
            className="w-full"
          >
            Health
          </Button>
          <Button
            onClick={() => onSelectCategory('enterprises')}
            variant="outline"
            className="w-full"
          >
            Enterprises
          </Button>
          <AlertDialogAction onClick={onCancel} className="w-full">
            Cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
