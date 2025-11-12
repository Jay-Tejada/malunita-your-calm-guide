import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

const TestAll = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const addResult = (name: string, result: TestResult) => {
    setResults(prev => ({ ...prev, [name]: result }));
    setLoading(prev => ({ ...prev, [name]: false }));
  };

  const testFunction = async (name: string, body: any) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const { data, error } = await supabase.functions.invoke(name, { body });
      addResult(name, {
        success: !error,
        data: data || null,
        error: error?.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error: any) {
      addResult(name, {
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const ResultDisplay = ({ name }: { name: string }) => {
    const result = results[name];
    if (!result) return null;

    return (
      <div className={`mt-4 p-4 rounded border ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <div className="font-mono text-sm">
          <div className="mb-2 text-xs opacity-70">[{result.timestamp}]</div>
          {result.success ? (
            <div>
              <div className="text-green-700 font-bold mb-2">✓ SUCCESS</div>
              <pre className="text-xs overflow-auto max-h-96 bg-white p-2 rounded">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <div className="text-red-700 font-bold mb-2">✗ ERROR</div>
              <div className="text-red-600">{result.error}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Edge Function Tests</h1>
      <p className="text-muted-foreground mb-6">Test all edge functions with example payloads</p>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>text-to-speech</CardTitle>
              <CardDescription>Convert text to audio</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('text-to-speech', { text: "Hello, this is a test of text to speech" })}
                disabled={loading['text-to-speech']}
              >
                {loading['text-to-speech'] ? 'Testing...' : 'Test TTS'}
              </Button>
              <ResultDisplay name="text-to-speech" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>transcribe-audio</CardTitle>
              <CardDescription>Transcribe audio to text (requires base64 audio)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Note: This requires actual audio data. Use the /test-core page to test with real audio.
              </p>
              <Button variant="outline" disabled>
                Requires Audio Recording
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>categorize-task</CardTitle>
              <CardDescription>Categorize a task into domains</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('categorize-task', { text: "Buy groceries and cook dinner" })}
                disabled={loading['categorize-task']}
              >
                {loading['categorize-task'] ? 'Testing...' : 'Test Categorize'}
              </Button>
              <ResultDisplay name="categorize-task" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>split-tasks</CardTitle>
              <CardDescription>Split text into multiple tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('split-tasks', { 
                  text: "Email John about the project, call Sarah at 3pm, and finish the presentation" 
                })}
                disabled={loading['split-tasks']}
              >
                {loading['split-tasks'] ? 'Testing...' : 'Test Split Tasks'}
              </Button>
              <ResultDisplay name="split-tasks" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>extract-tasks</CardTitle>
              <CardDescription>Extract tasks from voice input</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('extract-tasks', { 
                  text: "I need to work on the presentation today and maybe call the client tomorrow" 
                })}
                disabled={loading['extract-tasks']}
              >
                {loading['extract-tasks'] ? 'Testing...' : 'Test Extract'}
              </Button>
              <ResultDisplay name="extract-tasks" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>suggest-tasks</CardTitle>
              <CardDescription>Get AI suggestions for new tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('suggest-tasks', { 
                  tasks: [
                    { title: "Finish presentation", completed: false },
                    { title: "Email client", completed: true }
                  ],
                  domain: "work"
                })}
                disabled={loading['suggest-tasks']}
              >
                {loading['suggest-tasks'] ? 'Testing...' : 'Test Suggestions'}
              </Button>
              <ResultDisplay name="suggest-tasks" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>suggest-focus</CardTitle>
              <CardDescription>Get AI suggestions for tasks to focus on</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('suggest-focus', { 
                  tasks: [
                    { title: "Urgent: Finish report", category: "work" },
                    { title: "Buy groceries", category: "home" },
                    { title: "Go for a run", category: "gym" }
                  ]
                })}
                disabled={loading['suggest-focus']}
              >
                {loading['suggest-focus'] ? 'Testing...' : 'Test Focus'}
              </Button>
              <ResultDisplay name="suggest-focus" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>chat-completion</CardTitle>
              <CardDescription>Get AI chat responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('chat-completion', { 
                  messages: [
                    { role: "user", content: "What should I focus on today?" }
                  ]
                })}
                disabled={loading['chat-completion']}
              >
                {loading['chat-completion'] ? 'Testing...' : 'Test Chat'}
              </Button>
              <ResultDisplay name="chat-completion" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>runway-review</CardTitle>
              <CardDescription>Get a runway review summary</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('runway-review', {})}
                disabled={loading['runway-review']}
              >
                {loading['runway-review'] ? 'Testing...' : 'Test Runway Review'}
              </Button>
              <ResultDisplay name="runway-review" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>check-admin</CardTitle>
              <CardDescription>Check if user has admin privileges</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('check-admin', {})}
                disabled={loading['check-admin']}
              >
                {loading['check-admin'] ? 'Testing...' : 'Test Admin Check'}
              </Button>
              <ResultDisplay name="check-admin" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>admin-stats</CardTitle>
              <CardDescription>Get admin statistics (admin only)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('admin-stats', {})}
                disabled={loading['admin-stats']}
              >
                {loading['admin-stats'] ? 'Testing...' : 'Test Admin Stats'}
              </Button>
              <ResultDisplay name="admin-stats" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>send-push-notification</CardTitle>
              <CardDescription>Send a test push notification</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testFunction('send-push-notification', { 
                  title: "Test Notification",
                  body: "This is a test notification"
                })}
                disabled={loading['send-push-notification']}
              >
                {loading['send-push-notification'] ? 'Testing...' : 'Test Push'}
              </Button>
              <ResultDisplay name="send-push-notification" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestAll;
