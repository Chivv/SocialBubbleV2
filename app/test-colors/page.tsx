import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestColors() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Bubblegum Theme Test Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color Blocks</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary text-primary-foreground rounded-md border-2 border-primary shadow-md">
            Primary Color
          </div>
          <div className="p-4 bg-secondary text-secondary-foreground rounded-md border-2 border-secondary shadow-md">
            Secondary Color
          </div>
          <div className="p-4 bg-accent text-accent-foreground rounded-md border-2 border-accent shadow-md">
            Accent Color
          </div>
          <div className="p-4 bg-muted text-muted-foreground rounded-md border-2 border-muted shadow-md">
            Muted Color
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Card with Fat Borders</CardTitle>
          <CardDescription>This card should have thick borders and a shadow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Input Field</label>
            <Input placeholder="Type something here..." />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Field</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Border Tests</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border-2 border-primary rounded-md shadow-xs">
            2px Border
          </div>
          <div className="p-4 border-4 border-primary rounded-md shadow-md">
            4px Border
          </div>
          <div className="p-4 border-[6px] border-primary rounded-md shadow-lg">
            6px Border
          </div>
        </div>
      </div>
    </div>
  );
}