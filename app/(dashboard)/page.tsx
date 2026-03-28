import KpiCards from "@/components/dashboard/KpiCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import AuctionCountdown from "@/components/dashboard/AuctionCountdown";
import PortfolioBreakdown from "@/components/dashboard/PortfolioBreakdown";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

export default function CommandCentre() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCards />

      {/* Revenue Chart + Auction Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <AuctionCountdown />
        </div>
      </div>

      {/* Portfolio Breakdown + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioBreakdown />
        <ActivityFeed />
      </div>
    </div>
  );
}
