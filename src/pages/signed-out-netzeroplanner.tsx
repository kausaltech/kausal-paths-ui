import { StyledHeroCard } from '@/components/common/PageHero';
import { Container } from 'reactstrap';

export default function SignedOutNetZeroPlanner() {
  return (
    <Container className="p-5">
      <StyledHeroCard>
        <h2 className="pb-4">You've been signed out</h2>
        <ul>
          <li>
            <a href="https://netzero.kausal.dev">Go to the NetZeroPlanner dashboard</a>
          </li>
          <li>
            <a href="https://netzerocities.app">Go to the NetZeroCities Portal</a>
          </li>
        </ul>
      </StyledHeroCard>
    </Container>
  );
}
