
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ArrowRight, Video, Users, TrendingUp, Trophy, Share2, Download, BarChart3, Target, Zap } from "lucide-react";
import { MatchList } from "@/components/match-list";
import { Drawer } from "@/components/ui/drawer";
import Link from "next/link";

const Page = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Live Analytics",
      description: "Track your performance with detailed statistics, win rates, and performance trends"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Invite Friends",
      description: "Easily invite your friends and team members to play and track your matches together"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Score Tracking",
      description: "Real-time score tracking for singles and doubles matches with automatic calculations"
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "Player Profiles",
      description: "Complete player profiles with stats, achievements, and performance history"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Win Rates & Charts",
      description: "Visual representations of your progress with detailed charts and metrics"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Doubles Support",
      description: "Full support for doubles matches with team statistics and partner performance tracking"
    }
  ];

  const teamMembers = [
    { name: "You", initials: "Y", color: "bg-blue-500" },
    { name: "Friend 1", initials: "F1", color: "bg-purple-500" },
    { name: "Friend 2", initials: "F2", color: "bg-pink-500" },
    { name: "Friend 3", initials: "F3", color: "bg-green-500" },
    { name: "Friend 4", initials: "F4", color: "bg-orange-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50">
              <Badge variant="default" className="text-xs">New</Badge>
              <span className="text-sm text-muted-foreground">Track your badminton matches in real-time</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your Badminton
              <span className="block text-muted-foreground">Performance Hub</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground">
              Track matches, analyze performance, invite friends, and become a better badminton player. Built by badminton players, for badminton players.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => setIsDialogOpen(true)}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                <Video className="mr-2 h-4 w-4" />
                View Demo
              </Button>
            </div>

            {/* Install as App Option */}
            <div className="pt-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Download className="mr-2 h-4 w-4" />
                Get as App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to track, analyze, and improve your badminton game
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Components Showcase */}
      <div className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Experience the Interface</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how intuitive and powerful our interface is. Try interactive components below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Match List Preview Card */}
            <Card className="p-6 border border-border bg-muted/20">
              <h3 className="font-semibold text-lg mb-4">Match History</h3>
              <p className="text-sm text-muted-foreground mb-4">See your recent matches at a glance</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold">
                      YF1
                    </div>
                    <div>
                      <p className="text-sm font-medium">You & Friend 1</p>
                      <p className="text-xs text-muted-foreground">vs Friend 2 & Friend 3</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">21-18</p>
                    <p className="text-xs text-muted-foreground">Won</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold">
                      YF2
                    </div>
                    <div>
                      <p className="text-sm font-medium">You & Friend 2</p>
                      <p className="text-xs text-muted-foreground">vs Friend 1 & Friend 3</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 dark:text-red-400">19-21</p>
                    <p className="text-xs text-muted-foreground">Lost</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View All Matches
              </Button>
            </Card>

            {/* Interactive Components Card */}
            <Card className="p-6 border border-border bg-muted/20">
              <h3 className="font-semibold text-lg mb-4">Try It Out</h3>
              <p className="text-sm text-muted-foreground mb-4">Explore our interface with interactive components</p>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Create Match Dialog
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Invite Friends Drawer
                </Button>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Explore All Features
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Advanced Analytics</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Understand your performance with detailed charts and statistics
            </p>
          </div>

          <Card className="p-8 md:p-12 border border-border bg-muted/20">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">78%</div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">24</div>
                <p className="text-sm text-muted-foreground">Matches Played</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">+125</div>
                <p className="text-sm text-muted-foreground">Points Difference</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-6">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Full Analytics
            </Button>
          </Card>
        </div>
      </div>

      {/* Used By Section */}
      <div className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Used By Badminton Players</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our growing community of badminton enthusiasts
            </p>
          </div>

          <Card className="p-8 md:p-10 border border-border bg-muted/20">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className={`h-16 w-16 rounded-full ${member.color} flex items-center justify-center text-white font-bold text-lg`}>
                    {member.initials}
                  </div>
                  <p className="text-sm font-medium text-center whitespace-nowrap">{member.name}</p>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2 ml-4">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                  <span className="text-2xl">+</span>
                </div>
                <p className="text-sm font-medium text-center">Add More</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* About Us Section */}
      <div className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Our Story</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by badminton players, for badminton players
            </p>
          </div>

          <Card className="p-8 md:p-12 border border-border bg-muted/20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">How it all started</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We're a group of passionate badminton players who wanted a better way to track our matches, analyze our performance, and stay motivated. Frustrated with spreadsheets and manual tracking, we built this platform to solve our own problem.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  What started as a simple score tracker evolved into a comprehensive platform that helps players at all levels understand their game better and improve faster. Today, we're proud to share this tool with badminton players everywhere.
                </p>
                <div className="pt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Developed by</p>
                  <p className="font-medium">The Badminton Collective</p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg h-80 flex items-center justify-center border border-border">
                <div className="text-center space-y-3">
                  <div className="text-6xl">🏸</div>
                  <p className="text-muted-foreground">Team Photo Coming Soon</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Elevate Your Game?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start tracking your matches and analyzing your performance today. It's free to get started.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setIsDialogOpen(true)}>
              Sign Up Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
             
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>

            </div>
            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>

            </div>
          </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2026 Badminton Tracker. All rights reserved.
            </p>
        </div>
      </footer>


      {/* Drawer Demo - Invite Friends */}
              
    </div>
  );
};

export default Page;





