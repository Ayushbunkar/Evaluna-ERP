"use client";

import { useEffect, useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { motion } from "framer-motion";

export function ResponsiveTest() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [breakpoint, setBreakpoint] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Determine breakpoint
      if (window.innerWidth < 640) {
        setBreakpoint("Mobile (sm)");
      } else if (window.innerWidth >= 640 && window.innerWidth < 768) {
        setBreakpoint("Tablet (md)");
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setBreakpoint("Laptop (lg)");
      } else if (window.innerWidth >= 1024 && window.innerWidth < 1280) {
        setBreakpoint("Desktop (xl)");
      } else {
        setBreakpoint("Large Monitor (2xl)");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const testCases = [
    {
      name: "Container System",
      test: () => {
        const container = document.createElement("div");
        container.className = "container";
        document.body.appendChild(container);
        const width = container.offsetWidth;
        document.body.removeChild(container);
        return width > 0;
      },
    },
    {
      name: "Responsive Grid",
      test: () => {
        const grid = document.createElement("div");
        grid.className = "grid-gap";
        document.body.appendChild(grid);
        const gap = window.getComputedStyle(grid).gap;
        document.body.removeChild(grid);
        return gap !== "0px";
      },
    },
    {
      name: "Responsive Text",
      test: () => {
        const text = document.createElement("div");
        text.className = "text-responsive";
        document.body.appendChild(text);
        const fontSize = window.getComputedStyle(text).fontSize;
        document.body.removeChild(text);
        return fontSize !== "16px";
      },
    },
    {
      name: "Responsive Table",
      test: () => {
        const table = document.createElement("div");
        table.className = "responsive-table";
        document.body.appendChild(table);
        const overflowX = window.getComputedStyle(table).overflowX;
        document.body.removeChild(table);
        return overflowX === "auto";
      },
    },
  ];

  const [results, setResults] = useState<{ name: string; passed: boolean }[]>([]);

  const runTests = () => {
    const testResults = testCases.map((testCase) => {
      try {
        const passed = testCase.test();
        return { name: testCase.name, passed };
      } catch (error) {
        return { name: testCase.name, passed: false };
      }
    });
    setResults(testResults);
  };

  return (
    <div className="container space-y-6 py-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Responsive Design Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Current Screen Size</p>
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {screenSize.width} × {screenSize.height} px
                </span>
                <span className={`font-medium ${breakpoint.includes("Mobile") ? "text-blue-600" : breakpoint.includes("Tablet") ? "text-green-600" : breakpoint.includes("Laptop") ? "text-yellow-600" : breakpoint.includes("Desktop") ? "text-orange-600" : "text-red-600"}`}>
                  {breakpoint}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Test Status</p>
              <Button onClick={runTests} className="w-full sm:w-auto">
                Run Responsive Tests
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-base sm:text-lg">Test Results</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between rounded-lg p-3 ${result.passed ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                  >
                    <span className="font-medium text-xs sm:text-sm">{result.name}</span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {result.passed ? "✓ PASSED" : "✗ FAILED"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Responsive Components Showcase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Container System</h4>
            <div className="container bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-muted-foreground text-xs sm:text-sm">
                This container automatically adjusts width based on screen size
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Responsive Grid</h4>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <p className="text-muted-foreground text-xs sm:text-sm">Grid Item {item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Responsive Text</h4>
            <p className="text-responsive text-muted-foreground">
              This text automatically adjusts size based on screen width. On mobile it will be smaller, on desktop it will be larger.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Responsive Table</h4>
            <div className="responsive-table border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 sm:p-3 text-left">ID</th>
                    <th className="p-2 sm:p-3 text-left">Name</th>
                    <th className="p-2 sm:p-3 text-left">Status</th>
                    <th className="p-2 sm:p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((item) => (
                    <tr key={item} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-2 sm:p-3">#{item}</td>
                      <td className="p-2 sm:p-3">Sample Item {item}</td>
                      <td className="p-2 sm:p-3">Active</td>
                      <td className="p-2 sm:p-3 text-right">$100.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}