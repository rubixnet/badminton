"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  Trash2,
  Save,
  X,
  Pencil,
  Plus,
  Calendar as CalendarIcon,
  Repeat,
  MoreHorizontal,
  Copy,
  Search,
} from "lucide-react";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/types/match";

interface AdminMatchTableProps {
  data: Match[];
  onUpdate: (match: Match) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (match: any) => Promise<void>;
}

export function AdminMatchTable({
  data,
  onUpdate,
  onDelete,
  onCreate,
}: AdminMatchTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { toast } = useToast();

  // New Match State
  const [newMatchDate, setNewMatchDate] = useState<Date>(new Date());

  const [newTeam1P1, setNewTeam1P1] = useState("");
  const [newTeam1P2, setNewTeam1P2] = useState("");
  const [newTeam1Score, setNewTeam1Score] = useState("");
  const [newTeam2P1, setNewTeam2P1] = useState("");
  const [newTeam2P2, setNewTeam2P2] = useState("");
  const [newTeam2Score, setNewTeam2Score] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [keepDate, setKeepDate] = useState(false);

  // Search and Player Selection State
  const [searchTerm, setSearchTerm] = useState("");
  const [usePlayerSelection, setUsePlayerSelection] = useState(false);

  const availablePlayers = ["Gaurav", "Om", "Satyajeet", "Vaibhav", "Virochan"];

  // Get available players for each position (excluding already selected ones)
  const getAvailablePlayers = (excludePlayers: string[]) => {
    return availablePlayers.filter(
      (player) => !excludePlayers.includes(player),
    );
  };

  // Player Selection Component
  const PlayerSelector = ({
    value,
    onChange,
    placeholder,
    excludePlayers = [],
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    excludePlayers?: string[];
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update input value when value prop changes
    useEffect(() => {
      if (inputRef.current && inputRef.current.value !== value) {
        inputRef.current.value = value;
      }
    }, [value]);

    if (!usePlayerSelection) {
      return (
        <Input
          ref={inputRef}
          placeholder={placeholder}
          defaultValue={value}
          onChange={(e) => {
            const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
            e.target.value = filteredValue;
            onChange(filteredValue);
          }}
          className="h-8"
        />
      );
    }

    const available = getAvailablePlayers(excludePlayers);

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-8"
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(true);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            role="combobox"
            aria-label={`Select ${placeholder}`}
          >
            {value || (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Focus will be handled by Command
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <Command>
            <CommandInput placeholder="Search players..." />
            <CommandEmpty>No players found.</CommandEmpty>
            <CommandGroup>
              {available.map((player) => (
                <CommandItem
                  key={player}
                  value={player}
                  onSelect={(selectedValue) => {
                    onChange(selectedValue);
                    setIsOpen(false);
                  }}
                >
                  {player}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((match) => {
      const searchLower = searchTerm.toLowerCase();

      // Search in player names
      const team1Players = match.team1.players
        .map((p) => p?.name?.toLowerCase() || "")
        .join(" ");
      const team2Players = match.team2.players
        .map((p) => p?.name?.toLowerCase() || "")
        .join(" ");

      // Search in scores
      const scores = `${match.team1.score} ${match.team2.score}`;

      // Search in date
      const date = format(
        new Date(match.createdAt),
        "MMM d, yyyy",
      ).toLowerCase();

      return (
        team1Players.includes(searchLower) ||
        team2Players.includes(searchLower) ||
        scores.includes(searchLower) ||
        date.includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const handleEdit = (match: Match) => {
    setEditingId(match.id);
    setEditForm({
      team1P1: match.team1.players[0]?.name || "",
      team1P2: match.team1.players[1]?.name || "",
      team1Score: match.team1.score,
      team2P1: match.team2.players[0]?.name || "",
      team2P2: match.team2.players[1]?.name || "",
      team2Score: match.team2.score,
      date: new Date(match.createdAt),
    });
  };

  const handleDuplicate = (match: Match) => {
    setNewTeam1P1(match.team1.players[0]?.name || "");
    setNewTeam1P2(match.team1.players[1]?.name || "");
    setNewTeam1Score(match.team1.score.toString());
    setNewTeam2P1(match.team2.players[0]?.name || "");
    setNewTeam2P2(match.team2.players[1]?.name || "");
    setNewTeam2Score(match.team2.score.toString());

    const date = new Date(match.createdAt);
    setNewMatchDate(date);
    setNewMatchHour(format(date, "HH"));
    setNewMatchMinute(format(date, "mm"));

    toast({
      title: "Match Duplicated",
      description: "Match details copied to Quick Add form",
    });

    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (originalMatch: Match) => {
    try {
      const updatedMatch = {
        ...originalMatch,
        createdAt: editForm.date.toISOString(),
        team1: {
          ...originalMatch.team1,
          score: parseInt(editForm.team1Score),
          players: [
            { ...originalMatch.team1.players[0], name: editForm.team1P1 },
            editForm.team1P2
              ? { ...originalMatch.team1.players[1], name: editForm.team1P2 }
              : undefined,
          ].filter(Boolean) as any[],
        },
        team2: {
          ...originalMatch.team2,
          score: parseInt(editForm.team2Score),
          players: [
            { ...originalMatch.team2.players[0], name: editForm.team2P1 },
            editForm.team2P2
              ? { ...originalMatch.team2.players[1], name: editForm.team2P2 }
              : undefined,
          ].filter(Boolean) as any[],
        },
      };
      await onUpdate(updatedMatch);
      setEditingId(null);
      toast({ title: "Success", description: "Match updated" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match",
        variant: "destructive",
      });
    }
  };
 

  const handleCreate = async () => {
    if (!newTeam1P1 || !newTeam2P1 || !newTeam1Score || !newTeam2Score) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    setIsCreating(true);
    try {
      const finalDate = new Date(
        newMatchDate.getFullYear(),
        newMatchDate.getMonth(),
        newMatchDate.getDate(),
      );

      // Always use current time
      const now = new Date();
      finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const matchData = {
        team1: {
          players: [
            { name: newTeam1P1, bonusPoints: 0 },
            newTeam1P2 ? { name: newTeam1P2, bonusPoints: 0 } : null,
          ].filter(Boolean),
          score: parseInt(newTeam1Score),
        },
        team2: {
          players: [
            { name: newTeam2P1, bonusPoints: 0 },
            newTeam2P2 ? { name: newTeam2P2, bonusPoints: 0 } : null,
          ].filter(Boolean),
          score: parseInt(newTeam2Score),
        },
        createdAt: finalDate.toISOString(),
        checkpoints: [],
      };
      await onCreate(matchData);

      // Reset form
      setNewTeam1P1("");
      setNewTeam1P2("");
      setNewTeam1Score("");
      setNewTeam2P1("");
      setNewTeam2P2("");
      setNewTeam2Score("");

      if (!keepDate) {
        setNewMatchDate(new Date());
        setNewMatchHour("12");
        setNewMatchMinute("00");
      }

      toast({ title: "Success", description: "Match created" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameChange = useCallback((value: string, field: string) => {
    const filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
    setEditForm((prev: any) => ({ ...prev, [field]: filteredValue }));
  }, []);

  const columns = useMemo<ColumnDef<Match>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        size: 120,
        minSize: 120,
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          if (isEditing) {
            return (
              <Popover
                open={isEditCalendarOpen}
                onOpenChange={setIsEditCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full pl-3 text-left font-normal h-8"
                  >
                    {editForm.date ? (
                      format(editForm.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editForm.date}
                    onSelect={(date) => {
                      if (date) {
                        setEditForm({ ...editForm, date });
                        setIsEditCalendarOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            );
          }
          return (
            <div className="whitespace-nowrap">
              {format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        id: "team1",
        header: "Team 1",
        size: 160,
        minSize: 160,
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          if (isEditing) {
            return (
              <div className="flex flex-col gap-1">
                <PlayerSelector
                  value={editForm.team1P1}
                  onChange={(value) =>
                    setEditForm({ ...editForm, team1P1: value })
                  }
                  placeholder="Player 1"
                  excludePlayers={[
                    editForm.team1P2,
                    editForm.team2P1,
                    editForm.team2P2,
                  ].filter(Boolean)}
                />
                <PlayerSelector
                  value={editForm.team1P2}
                  onChange={(value) =>
                    setEditForm({ ...editForm, team1P2: value })
                  }
                  placeholder="Player 2"
                  excludePlayers={[
                    editForm.team1P1,
                    editForm.team2P1,
                    editForm.team2P2,
                  ].filter(Boolean)}
                />
              </div>
            );
          }
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {row.original.team1.players[0]?.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {row.original.team1.players[1]?.name}
              </span>
            </div>
          );
        },
      },
      {
        id: "score",
        header: "Score",
        size: 100,
        minSize: 100,
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <Input
                  value={editForm.team1Score}
                  onChange={(e) =>
                    /^\d*$/.test(e.target.value) &&
                    setEditForm({ ...editForm, team1Score: e.target.value })
                  }
                  className="h-7 w-12 text-center p-0"
                />
                <span>-</span>
                <Input
                  value={editForm.team2Score}
                  onChange={(e) =>
                    /^\d*$/.test(e.target.value) &&
                    setEditForm({ ...editForm, team2Score: e.target.value })
                  }
                  className="h-7 w-12 text-center p-0"
                />
              </div>
            );
          }
          return (
            <div className="font-bold text-center">
              {row.original.team1.score} - {row.original.team2.score}
            </div>
          );
        },
      },
      {
        id: "team2",
        header: "Team 2",
        size: 160,
        minSize: 160,
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          if (isEditing) {
            return (
              <div className="flex flex-col gap-1">
                <PlayerSelector
                  value={editForm.team2P1}
                  onChange={(value) =>
                    setEditForm({ ...editForm, team2P1: value })
                  }
                  placeholder="Player 1"
                  excludePlayers={[
                    editForm.team1P1,
                    editForm.team1P2,
                    editForm.team2P2,
                  ].filter(Boolean)}
                />
                <PlayerSelector
                  value={editForm.team2P2}
                  onChange={(value) =>
                    setEditForm({ ...editForm, team2P2: value })
                  }
                  placeholder="Player 2"
                  excludePlayers={[
                    editForm.team1P1,
                    editForm.team1P2,
                    editForm.team2P1,
                  ].filter(Boolean)}
                />
              </div>
            );
          }
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {row.original.team2.players[0]?.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {row.original.team2.players[1]?.name}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 80,
        minSize: 80,
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          if (isEditing) {
            return (
              <div className="flex gap-1 justify-end">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600"
                  onClick={() => handleSave(row.original)}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          }
          return (
            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleEdit(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDuplicate(row.original)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(row.original.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [editingId, editForm, onDelete],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-row gap-4 items-center justify-start">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search matches by name, score, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      <div className="border p-4 bg-muted/30 overflow-x-auto rounded-lg">
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">
          Quick Add Match
        </h3>
        <div className="flex lg:flex-row gap-2 min-w-[1000px] lg:min-w-0 lg:w-full items-center">
          <div className="flex items-center gap-2">
            <Button
              variant={keepDate ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setKeepDate(!keepDate)}
              title="Keep date after adding match"
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[120px] justify-start text-left font-normal h-8"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newMatchDate ? (
                    format(newMatchDate, "MMM d")
                  ) : (
                    <span>Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newMatchDate}
                  onSelect={(date) => {
                    if (date) {
                      setNewMatchDate(date);
                      setIsCalendarOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            {/* <div className="flex items-center gap-1">
              <Select
                value={newMatchHour}
                onValueChange={(v) => setNewMatchHour(v)}
              >
                <SelectTrigger className="w-[65px] h-9">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select
                value={newMatchMinute}
                onValueChange={(v) => setNewMatchMinute(v)}
              >
                <SelectTrigger className="w-[65px] h-9">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {/* Team 1 Column */}
          <div className="flex-1 min-w-[200px]">
            <div className="grid grid-cols-2 gap-2">
              <PlayerSelector
                value={newTeam1P1}
                onChange={setNewTeam1P1}
                placeholder="P1"
                excludePlayers={[newTeam1P2, newTeam2P1, newTeam2P2].filter(
                  Boolean,
                )}
              />
              <PlayerSelector
                value={newTeam1P2}
                onChange={setNewTeam1P2}
                placeholder="P2"
                excludePlayers={[newTeam1P1, newTeam2P1, newTeam2P2].filter(
                  Boolean,
                )}
              />
            </div>
          </div>

          {/* Score Column */}
          <div className="w-[120px]">
            <div className="flex items-center gap-2 justify-center">
              <Input
                className="text-center h-8 w-12"
                placeholder="0"
                value={newTeam1Score}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setNewTeam1Score(e.target.value)
                }
              />
              <span className="font-bold">-</span>
              <Input
                className="text-center h-8 w-12"
                placeholder="0"
                value={newTeam2Score}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setNewTeam2Score(e.target.value)
                }
              />
            </div>
          </div>

          {/* Team 2 Column */}
          <div className="flex-1 min-w-[200px]">
            <div className="grid grid-cols-2 gap-2">
              <PlayerSelector
                value={newTeam2P1}
                onChange={setNewTeam2P1}
                placeholder="P1"
                excludePlayers={[newTeam1P1, newTeam1P2, newTeam2P2].filter(
                  Boolean,
                )}
              />
              <PlayerSelector
                value={newTeam2P2}
                onChange={setNewTeam2P2}
                placeholder="P2"
                excludePlayers={[newTeam1P1, newTeam1P2, newTeam2P1].filter(
                  Boolean,
                )}
              />
            </div>
          </div>

          {/* Actions Column */}
          <div className="w-[60px]">
            <Button
              className="w-full h-9"
              onClick={handleCreate}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[620px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No matches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
