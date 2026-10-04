import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Amount, Box, Text } from '@razorpay/blade/components';

// Blade's own Box docs warn against using it as an interactive trigger —
// a real <button> is the right element, styled to reset its defaults.
const RowButton = styled.button`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
`;

interface DecisionCardProps {
  title: string;
  subtitle?: string;
  amount: number;
  badge?: ReactNode;
  onClick?: () => void;
  /** Rendered as a sibling, not nested inside the row's own button — so an
   *  inline action (e.g. Undo) never ends up as a <button> inside a <button>. */
  trailing?: ReactNode;
}

export function DecisionCard({ title, subtitle, amount, badge, onClick, trailing }: DecisionCardProps) {
  const mainContent = (
    <>
      <Box display="flex" flexDirection="column" gap="spacing.1">
        <Box display="flex" alignItems="center" gap="spacing.2" flexWrap="wrap">
          <Text weight="semibold">{title}</Text>
          {badge}
        </Box>
        {subtitle && (
          <Text size="small" color="surface.text.gray.muted">
            {subtitle}
          </Text>
        )}
      </Box>
      <Amount value={amount} suffix="none" size="medium" type="body" weight="semibold" />
    </>
  );

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap="spacing.4" paddingY="spacing.4">
      {onClick ? <RowButton onClick={onClick}>{mainContent}</RowButton> : <Box display="flex" flex="1" alignItems="center" justifyContent="space-between" gap="spacing.4">{mainContent}</Box>}
      {trailing}
    </Box>
  );
}
