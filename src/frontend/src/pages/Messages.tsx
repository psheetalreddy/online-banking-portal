import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Message } from "../backend";
import { Variant_read_unread } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";
import { formatDate, generateId } from "../lib/utils";

export default function Messages() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => actor!.listMessages(),
    enabled: !!actor,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => actor!.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });

  const markUnread = useMutation({
    mutationFn: (id: string) => actor!.markUnread(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteMessage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Message deleted");
      setDeleteTarget(null);
      if (selected?.messageId === deleteTarget?.messageId) setSelected(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const createMut = useMutation({
    mutationFn: (msg: Message) => actor!.createMessage(msg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Message sent");
      setComposeOpen(false);
      setSubject("");
      setBody("");
    },
    onError: () => toast.error("Failed to send"),
  });

  const handleOpen = (msg: Message) => {
    setSelected(msg);
    if (msg.messageStatus === Variant_read_unread.unread) {
      markRead.mutate(msg.messageId);
    }
  };

  const handleCompose = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Fill all fields");
      return;
    }
    createMut.mutate({
      messageId: generateId(),
      subject: subject.trim(),
      messageText: body.trim(),
      messageStatus: Variant_read_unread.unread,
      createdAt: BigInt(Date.now()),
    });
  };

  const filtered =
    filter === "unread"
      ? messages.filter((m) => m.messageStatus === Variant_read_unread.unread)
      : messages;

  return (
    <div data-ocid="messages.page" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Messages</h2>
        <Button
          size="sm"
          data-ocid="messages.compose.button"
          onClick={() => setComposeOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Compose
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "unread")}
      >
        <TabsList data-ocid="messages.filter.tab">
          <TabsTrigger value="all">All ({messages.length})</TabsTrigger>
          <TabsTrigger value="unread">
            Unread (
            {
              messages.filter(
                (m) => m.messageStatus === Variant_read_unread.unread,
              ).length
            }
            )
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No messages found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg, i) => {
            const isUnread = msg.messageStatus === Variant_read_unread.unread;
            return (
              <div
                key={msg.messageId}
                data-ocid={`messages.item.${i + 1}`}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors bg-white ${
                  isUnread ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer hover:opacity-80"
                  onClick={() => handleOpen(msg)}
                >
                  {isUnread ? (
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <MailOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm truncate ${isUnread ? "font-semibold" : "font-medium"}`}
                    >
                      {msg.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 ml-3">
                  {isUnread && (
                    <Badge className="bg-primary text-white text-xs">New</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    data-ocid={`messages.delete_button.${i + 1}`}
                    onClick={() => setDeleteTarget(msg)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg" data-ocid="messages.detail.dialog">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription>
              {selected ? formatDate(selected.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {selected?.messageText}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selected) {
                  markUnread.mutate(selected.messageId);
                  setSelected(null);
                }
              }}
            >
              Mark as Unread
            </Button>
            <Button
              onClick={() => setSelected(null)}
              data-ocid="messages.detail.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="messages.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.subject}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="messages.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMut.mutate(deleteTarget.messageId)
              }
              disabled={deleteMut.isPending}
              data-ocid="messages.delete.confirm_button"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent data-ocid="messages.compose.dialog">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Send a message or file a complaint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="msg-subject"
                className="text-sm font-medium mb-1.5 block"
              >
                Subject
              </label>
              <Input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                data-ocid="messages.subject.input"
              />
            </div>
            <div>
              <label
                htmlFor="msg-body"
                className="text-sm font-medium mb-1.5 block"
              >
                Message
              </label>
              <Textarea
                id="msg-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                data-ocid="messages.body.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompose}
              disabled={createMut.isPending}
              data-ocid="messages.compose.submit_button"
            >
              {createMut.isPending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
