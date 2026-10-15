"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type Table as TanstackTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
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
import { useToast } from "@/hooks/use-toast";
import type { Match, Player } from "@/types/match";

interface AdminMatchTableProps {
  data: Match[];
  onUpdate: (match: Match) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (match: any) => Promise<void>;
}

function PlayerSelector({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, "");
        onChange(filteredValue);
      }}
      className="h-8 text-sm *:data-[slot=input]:h-8 *:data-[slot=input]:leading-8"
    />
  );
}

/**
 * State and submit handler for the Quick Add strip.
 *
 * All six inputs plus the date/keep-date toggles and the create action live
 * here so `AdminMatchTable` only wires the component up.
 */
function useQuickAddMatch(
  onCreate: (match: Omit<Match, "id" | "groupId" | "userId" | "userName">) => Promise<void>,
) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [keepDate, setKeepDate] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [newMatchDate, setNewMatchDate] = useState<Date | undefined>(new Date());
  const [values, setValues] = useState<QuickAddValues>({
    team1P1: "",
    team1P2: "",
    team1Score: "",
    team2P1: "",
    team2P2: "",
    team2Score: "",
  });

  const setField = useCallback((field: QuickAddField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const create = async () => {
    if (!values.team1P1 || !values.team2P1 || !values.team1Score || !values.team2Score) {
    toast({
      title: "Error",
      description: "Please fill in required fields",
      variant: "destructive",
    });
    return;
  }
  setIsCreating(true);
  try {
    // A cleared calendar leaves `newMatchDate` undefined; fall back to today.
    const baseDate = newMatchDate ?? new Date();
    const finalDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
    );

    // Always use current time
    const now = new Date();
    finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const matchData = {
      team1: {
        players: [
          { name: values.team1P1, bonusPoints: 0 },
          values.team1P2 ? { name: values.team1P2, bonusPoints: 0 } : null,
        ].filter((p): p is Player => p !== null),
        score: parseInt(values.team1Score),
      },
      team2: {
        players: [
          { name: values.team2P1, bonusPoints: 0 },
          values.team2P2 ? { name: values.team2P2, bonusPoints: 0 } : null,
        ].filter((p): p is Player => p !== null),
        score: parseInt(values.team2Score),
      },
      createdAt: finalDate.toISOString(),
      checkpoints: [],
    };
    await onCreate(matchData);

    // Reset form
      setValues({
        team1P1: "",
        team1P2: "",
        team1Score: "",
        team2P1: "",
        team2P2: "",
        team2Score: "",
      });

    if (!keepDate) {
      setNewMatchDate(new Date());
    }

    toast({ title: "Success", description: "Match created" });
  } catch {
    toast({
      title: "Error",
      description: "Failed to create match",
      variant: "destructive",
    });
  } finally {
    setIsCreating(false);
  }
  };

  /** Copies an existing match into the form so it can be duplicated. */
  const prefill = useCallback((match: Match) => {
    setValues({
      team1P1: match.team1.players[0]?.name || "",
      team1P2: match.team1.players[1]?.name || "",
      team1Score: match.team1.score.toString(),
      team2P1: match.team2.players[0]?.name || "",
      team2P2: match.team2.players[1]?.name || "",
      team2Score: match.team2.score.toString(),
    });
    setNewMatchDate(new Date(match.createdAt));
  }, []);

  return {
    keepDate,
    toggleKeepDate: () => setKeepDate((k) => !k),
    prefill,
    isCalendarOpen,
    setIsCalendarOpen,
    newMatchDate,
    setNewMatchDate,
    values,
    setField,
    create,
    isCreating,
  };
}

/**
 * Narrows the table to rows matching the search box.
 *
 * Matching is intentionally loose - player names, scores, or the formatted
 * date - because it is a quick filter over a small list, not a query.
 */
function useFilteredMatches(data: Match[], searchTerm: string) {
  return useMemo(() => {
    if (!searchTerm) return data;

    const searchLower = searchTerm.toLowerCase();

    return data.filter((match) => {
      const team1Players = match.team1.players
        .map((p) => p?.name?.toLowerCase() || "")
        .join(" ");
      const team2Players = match.team2.players
        .map((p) => p?.name?.toLowerCase() || "")
        .join(" ");

      const scores = `${match.team1.score} ${match.team2.score}`;
      const date = format(new Date(match.createdAt), "MMM d, yyyy").toLowerCase();

      return (
        team1Players.includes(searchLower) ||
        team2Players.includes(searchLower) ||
        scores.includes(searchLower) ||
        date.includes(searchLower)
      );
    });
  }, [data, searchTerm]);
}

/** Match date: a formatted string, or a calendar picker while the row is edited. */
function DateCell({
  createdAt,
  isEditing,
  selectedDate,
  calendarOpen,
  onCalendarOpenChange,
  onChange,
}: {
  createdAt: string;
  isEditing: boolean;
  selectedDate: Date | undefined;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  onChange: (date: Date) => void;
}) {
  if (!isEditing) {
    return (
      <div className="whitespace-nowrap">
        {format(new Date(createdAt), "MMM d, yyyy")}
      </div>
    );
  }

  return (
    <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full h-8 justify-start pl-3 pr-2 text-left font-normal text-sm sm:text-sm [&_svg:not([class*='size-'])]:size-4"
          />
        }
      >
        {selectedDate ? (
          format(selectedDate, "PPP")
        ) : (
          <span>Pick a date</span>
        )}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(date);
              onCalendarOpenChange(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

type EditFormState = Record<string, any>;

function Team1Cell({
  match,
  isEditing,
  editForm,
  onChange,
}: {
  match: Match;
  isEditing: boolean;
  editForm: EditFormState;
  onChange: (updates: Record<string, any>) => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
              <PlayerSelector
                value={editForm.team1P1 || ""}
                onChange={(value) => onChange({ team1P1: value })}
                placeholder="Player 1"
              />
              <PlayerSelector
                value={editForm.team1P2 || ""}
                onChange={(value) => onChange({ team1P2: value })}
                placeholder="Player 2"
              />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-medium text-sm">
        {match.team1.players[0]?.name}
      </span>
      <span className="text-muted-foreground text-xs">
        {match.team1.players[1]?.name}
      </span>
    </div>
  );
}

function Team2Cell({
  match,
  isEditing,
  editForm,
  onChange,
}: {
  match: Match;
  isEditing: boolean;
  editForm: EditFormState;
  onChange: (updates: Record<string, any>) => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
              <PlayerSelector
                value={editForm.team2P1 || ""}
                onChange={(value) => onChange({ team2P1: value })}
                placeholder="Player 1"
              />
              <PlayerSelector
                value={editForm.team2P2 || ""}
                onChange={(value) => onChange({ team2P2: value })}
                placeholder="Player 2"
              />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-medium text-sm">
        {match.team2.players[0]?.name}
      </span>
      <span className="text-muted-foreground text-xs">
        {match.team2.players[1]?.name}
      </span>
    </div>
  );
}

/** Row action buttons: save/cancel while editing, otherwise edit + overflow menu. */
function MatchActionsCell({
  match,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDuplicate,
  onDelete,
}: {
  match: Match;
  isEditing: boolean;
  onEdit: (match: Match) => void;
  onSave: (match: Match) => void;
  onCancel: () => void;
  onDuplicate: (match: Match) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  if (isEditing) {
    return (
      <div className="flex gap-1 justify-end">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Save changes"
          className="h-8 w-8 text-green-600"
          onClick={() => onSave(match)}
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Cancel editing"
          className="h-8 w-8 text-red-600"
          onClick={onCancel}
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
        aria-label="Edit match"
        className="h-8 w-8"
        onClick={() => onEdit(match)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onDuplicate(match)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(match.id)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type QuickAddValues = {
  team1P1: string;
  team1P2: string;
  team1Score: string;
  team2P1: string;
  team2P2: string;
  team2Score: string;
};

type QuickAddField = keyof QuickAddValues;

/**
 * The "Quick Add Match" strip above the table.
 *
 * It is the most input-heavy part of the admin screen and touches none of the
 * table state, so it lives in its own component and communicates through a
 * plain values object plus one `onFieldChange`.
 */
function QuickAddMatch({
  keepDate,
  onToggleKeepDate,
  isCalendarOpen,
  onCalendarOpenChange,
  newMatchDate,
  onNewMatchDateChange,
  values,
  onFieldChange,
  onCreate,
  isCreating,
}: {
  keepDate: boolean;
  onToggleKeepDate: () => void;
  isCalendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  newMatchDate: Date | undefined;
  onNewMatchDateChange: (date: Date) => void;
  values: QuickAddValues;
  onFieldChange: (field: QuickAddField, value: string) => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  const scoreOnly = (field: QuickAddField) => (value: string) =>
    onFieldChange(field, value.replace(/[^\d]/g, ""));

  return (
    <div className="border p-4 bg-muted/30 overflow-x-auto rounded-lg">
      <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">
        Quick Add Match
      </h3>
      <div className="flex lg:flex-row gap-2 min-w-250 lg:min-w-0 lg:w-full items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={keepDate ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleKeepDate}
            title="Keep date after adding match"
          >
            <Repeat className="h-4 w-4" />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={onCalendarOpenChange}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="h-8 w-30 justify-start text-left font-normal text-sm sm:text-sm [&_svg:not([class*='size-'])]:size-4"
                />
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {newMatchDate ? (
                format(newMatchDate, "MMM d")
              ) : (
                <span>Date</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={newMatchDate}
                onSelect={(date) => {
                  if (date) {
                    onNewMatchDateChange(date);
                    onCalendarOpenChange(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-50">
          <div className="grid grid-cols-2 gap-2">
            <PlayerSelector
              value={values.team1P1}
              onChange={(value) => onFieldChange("team1P1", value)}
              placeholder="P1"
            />
            <PlayerSelector
              value={values.team1P2}
              onChange={(value) => onFieldChange("team1P2", value)}
              placeholder="P2"
            />
          </div>
        </div>

        <div className="w-30">
          <div className="flex items-center gap-2 justify-center">
            <Input
              className="h-8 w-12 text-center text-sm *:data-[slot=input]:h-8 *:data-[slot=input]:leading-8"
              placeholder="0"
              value={values.team1Score}
              onChange={(e) => scoreOnly("team1Score")(e.target.value)}
            />
            <span className="font-bold">-</span>
            <Input
              className="h-8 w-12 text-center text-sm *:data-[slot=input]:h-8 *:data-[slot=input]:leading-8"
              placeholder="0"
              value={values.team2Score}
              onChange={(e) => scoreOnly("team2Score")(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-w-50">
          <div className="grid grid-cols-2 gap-2">
            <PlayerSelector
              value={values.team2P1}
              onChange={(value) => onFieldChange("team2P1", value)}
              placeholder="P1"
            />
            <PlayerSelector
              value={values.team2P2}
              onChange={(value) => onFieldChange("team2P2", value)}
              placeholder="P2"
            />
          </div>
        </div>

        <div className="w-15">
          <Button
            className="w-full h-9"
            onClick={onCreate}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Free-text filter above the table. */
function MatchSearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-row  items-center justify-start">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2  transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search matches by name, score, or date."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 pl-7 text-sm *:data-[slot=input]:h-8 *:data-[slot=input]:leading-8"
        />
      </div>
    </div>
  );
}

/** One row per match, or the empty state. */
function MatchTableRows({
  table,
  columnCount,
}: {
  table: TanstackTable<Match>;
  columnCount: number;
}) {
  const rows = table.getRowModel().rows;

  if (!rows?.length) {
    return (
      <TableRow>
        <TableCell colSpan={columnCount} className="h-24 text-center">
          No matches found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
          className="group"
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id} className="whitespace-nowrap">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Previous/next page controls. */
function TablePagination({ table }: { table: TanstackTable<Match> }) {
  return (
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
  );
}

export function AdminMatchTable({
  data,
  onUpdate,
  onDelete,
  onCreate,
}: AdminMatchTableProps) {
  const quickAdd = useQuickAddMatch(onCreate);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { toast } = useToast();

  // `useQuickAddMatch` owns the Quick Add inputs, date, and submitting flag.
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);

  // Search and Player Selection State
  const [searchTerm, setSearchTerm] = useState("");
  const editFormRef = useRef<any>({});

  useEffect(() => {
    editFormRef.current = editForm;
  }, [editForm]);

  const updateEditForm = useCallback((updates: Record<string, any>) => {
    const next = { ...editFormRef.current, ...updates };
    editFormRef.current = next;
    setEditForm(next);
  }, []);

  // Filter data based on search term
  const filteredData = useFilteredMatches(data, searchTerm);

  const handleEdit = (match: Match) => {
    const nextEditForm = {
      team1P1: match.team1.players[0]?.name || "",
      team1P2: match.team1.players[1]?.name || "",
      team1Score: match.team1.score.toString(),
      team2P1: match.team2.players[0]?.name || "",
      team2P2: match.team2.players[1]?.name || "",
      team2Score: match.team2.score.toString(),
      date: new Date(match.createdAt),
    };

    setEditingId(match.id);
    setEditForm(nextEditForm);
    editFormRef.current = nextEditForm;
  };

  const handleDuplicate = useCallback(
    (match: Match) => {
      quickAdd.prefill(match);

      toast({
        title: "Match Duplicated",
        description: "Match details copied to Quick Add form",
      });

      // Scroll to top to see the form
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [quickAdd, toast],
  );

  const handleSave = useCallback(async (originalMatch: Match) => {
    const currentEditForm = editFormRef.current;

    try {
      const updatedMatch = {
        ...originalMatch,
        createdAt: currentEditForm.date.toISOString(),
        team1: {
          ...originalMatch.team1,
          score: parseInt(currentEditForm.team1Score),
          players: [
            { ...originalMatch.team1.players[0], name: currentEditForm.team1P1 },
            currentEditForm.team1P2
              ? { ...originalMatch.team1.players[1], name: currentEditForm.team1P2 }
              : undefined,
          ].filter(Boolean) as any[],
        },
        team2: {
          ...originalMatch.team2,
          score: parseInt(currentEditForm.team2Score),
          players: [
            { ...originalMatch.team2.players[0], name: currentEditForm.team2P1 },
            currentEditForm.team2P2
              ? { ...originalMatch.team2.players[1], name: currentEditForm.team2P2 }
              : undefined,
          ].filter(Boolean) as any[],
        },
      };
      await onUpdate(updatedMatch);
      setEditingId(null);
      toast({ title: "Success", description: "Match updated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update match",
        variant: "destructive",
      });
    }
  }, [onUpdate, toast]);
 

  const columns = useMemo<ColumnDef<Match>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        size: 120,
        minSize: 120,
        cell: ({ row }) => (
          <DateCell
            createdAt={row.getValue("createdAt") as string}
            isEditing={editingId === row.original.id}
            selectedDate={editFormRef.current.date}
            calendarOpen={isEditCalendarOpen}
            onCalendarOpenChange={setIsEditCalendarOpen}
            onChange={(date) => updateEditForm({ date })}
          />
        ),
      },
      {
        id: "team1",
        header: "Team 1",
        size: 160,
        minSize: 160,
        cell: ({ row }) => (
          <Team1Cell
            match={row.original}
            isEditing={editingId === row.original.id}
            editForm={editFormRef.current}
            onChange={updateEditForm}
          />
        ),
      },
      {
        id: "team2",
        header: "Team 2",
        size: 160,
        minSize: 160,
        cell: ({ row }) => (
          <Team2Cell
            match={row.original}
            isEditing={editingId === row.original.id}
            editForm={editFormRef.current}
            onChange={updateEditForm}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 80,
        minSize: 80,
        cell: ({ row }) => (
          <MatchActionsCell
            match={row.original}
            isEditing={editingId === row.original.id}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
            onDuplicate={handleDuplicate}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [editingId, isEditCalendarOpen, handleDuplicate, handleSave, onDelete, updateEditForm],
  );

  const table: TanstackTable<Match> = useReactTable({
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
      <MatchSearchBox value={searchTerm} onChange={setSearchTerm} />

      <QuickAddMatch
        keepDate={quickAdd.keepDate}
        onToggleKeepDate={quickAdd.toggleKeepDate}
        isCalendarOpen={quickAdd.isCalendarOpen}
        onCalendarOpenChange={quickAdd.setIsCalendarOpen}
        newMatchDate={quickAdd.newMatchDate}
        onNewMatchDateChange={quickAdd.setNewMatchDate}
        values={quickAdd.values}
        onFieldChange={quickAdd.setField}
        onCreate={quickAdd.create}
        isCreating={quickAdd.isCreating}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-155">
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
            <MatchTableRows table={table} columnCount={columns.length} />
          </TableBody>
        </Table>
      </div>

      <TablePagination table={table} />
    </div>
  );
}
