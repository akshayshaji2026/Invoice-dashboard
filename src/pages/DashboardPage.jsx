import React from "react";
import MainLayout from "../layouts/MainLayout.jsx";
import GreetingCTA from "../../components/GreetingCTA";
import StatsCards from "../../components/StatsCards";
import DashboardLayout from "./DashboardLayout.jsx";
import DashboardMobileFAB from "../../components/DashboardCTAs.jsx";

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardMobileFAB />
      <GreetingCTA />

      <section className="w-full">
        <StatsCards />
      </section>

      <DashboardLayout />
    </MainLayout>
  );
}
