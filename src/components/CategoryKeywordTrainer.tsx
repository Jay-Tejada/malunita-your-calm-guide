import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, Plus, BookmarkPlus } from 'lucide-react';
import { useCategoryKeywords } from '@/hooks/useCategoryKeywords';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const CategoryKeywordTrainer = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState('');
  const { categories } = useCustomCategories();
  const { keywords, addKeyword, deleteKeyword } = useCategoryKeywords(selectedCategoryId || undefined);

  const handleAddKeyword = async () => {
    if (!selectedCategoryId || !newKeyword.trim()) return;

    await addKeyword({ categoryId: selectedCategoryId, keyword: newKeyword });
    setNewKeyword('');
  };

  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);
  const filteredKeywords = selectedCategoryId 
    ? keywords.filter(k => k.custom_category_id === selectedCategoryId)
    : keywords;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookmarkPlus className="w-5 h-5 text-primary" />
          <CardTitle>Train Keywords</CardTitle>
        </div>
        <CardDescription>
          Teach Malunita to recognize keywords and phrases that should map to specific categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategoryId && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Keyword or Phrase</label>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., '1844', 'project alpha', 'client work'"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button 
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim()}
                  size="icon"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                When these words appear in a task, it will automatically suggest {selectedCategory?.name}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Trained Keywords for {selectedCategory?.name}
              </label>
              {filteredKeywords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No keywords trained yet. Add some to help Malunita learn!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredKeywords.map((keyword) => (
                    <Badge key={keyword.id} variant="secondary" className="gap-1">
                      {keyword.keyword}
                      <button
                        onClick={() => deleteKeyword(keyword.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedCategoryId && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Select a category to start training keywords
          </div>
        )}
      </CardContent>
    </Card>
  );
};
