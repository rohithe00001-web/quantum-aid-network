import { Layout } from '@/components/layout/Layout';
import { QVisionFeed } from '@/components/qvision/QVisionFeed';

export default function QVisionFeedPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Q-Vision Hazard Feed</h1>
          <p className="text-muted-foreground">Real-time hazard reports from civilians</p>
        </div>
        
        <QVisionFeed />
      </div>
    </Layout>
  );
}
