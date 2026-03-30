import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function FilterSidebar() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={`absolute top-0 left-0 h-full z-[1000] transition-all duration-300 ${
        collapsed ? "w-10" : "w-72"
      }`}
    >
      <div className="h-full bg-card/95 backdrop-blur-sm border-r shadow-lg flex flex-col">
        <div className="p-2 flex items-center justify-between border-b">
          {!collapsed && (
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="flex-1 p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Filters coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
