import { useState } from "react";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Tag, Home, Briefcase, Heart, DollarSign, ShoppingCart, Baby, Car, Plane, Coffee, Book, Music, Gamepad2, Film, Star, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";

const DEFAULT_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
];

const CATEGORY_ICONS = [
  { icon: Tag, label: "Tag" },
  { icon: Home, label: "Home" },
  { icon: Briefcase, label: "Work" },
  { icon: Heart, label: "Family" },
  { icon: DollarSign, label: "Money" },
  { icon: ShoppingCart, label: "Shopping" },
  { icon: Baby, label: "Kids" },
  { icon: Car, label: "Transport" },
  { icon: Plane, label: "Travel" },
  { icon: Coffee, label: "Food" },
  { icon: Book, label: "Learning" },
  { icon: Music, label: "Music" },
  { icon: Gamepad2, label: "Games" },
  { icon: Film, label: "Entertainment" },
  { icon: Star, label: "Important" },
  { icon: Zap, label: "Urgent" },
];

export const CustomCategoryManager = () => {
  const { categories, createCategory, deleteCategory, updateCategory } = useCustomCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6B7280");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const iconName = CATEGORY_ICONS[selectedIconIndex].label;
      if (editingId) {
        await updateCategory({ id: editingId, updates: { name, color, icon: iconName } });
      } else {
        await createCategory({ name, color, icon: iconName });
      }
      setName("");
      setColor("#6B7280");
      setSelectedIconIndex(0);
      setEditingId(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setColor(category.color || "#6B7280");
    const iconIndex = CATEGORY_ICONS.findIndex(i => i.label === category.icon);
    setSelectedIconIndex(iconIndex >= 0 ? iconIndex : 0);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? Tasks will remain but lose this category assignment.')) {
      await deleteCategory(id);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
    setName("");
    setColor("#6B7280");
    setSelectedIconIndex(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Custom Categories</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Create'} Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Wife & Kids, Bills, Purchases"
                  required
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {CATEGORY_ICONS.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedIconIndex(index)}
                        className={`p-2 rounded-lg border transition-all ${
                          selectedIconIndex === index
                            ? 'border-primary bg-primary/10 scale-110'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                        title={item.label}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6B7280"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {categories && categories.length > 0 ? (
          categories.map((category) => {
            const iconData = CATEGORY_ICONS.find(i => i.label === category.icon);
            const IconComponent = iconData?.icon || Tag;
            
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom categories yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
};
