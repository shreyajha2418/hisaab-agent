import { useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  ClockIcon,
  EditIcon,
  Heading,
  LinkIcon,
  Text,
  TextArea,
  WhatsAppIcon,
} from '@razorpay/blade/components';
import type { Bill, Customer, ReminderRecord } from '../types';
import type { SentReminder } from '../state/types';
import { formatINR } from '../utils/currency';
import { daysSince, formatShortDate } from '../utils/dates';

interface OverdueBill {
  bill: Bill;
  remaining: number;
  days: number;
}

interface RecoveryReminderProps {
  customer: Customer;
  overdueBills: OverdueBill[];
  record: ReminderRecord;
  sent?: SentReminder;
  onSend: (message: string, channel: string) => void;
}

const MERCHANT_NAME = 'Shree Ram Pharma Distributors';

function draftMessage(customer: Customer, overdueBills: OverdueBill[], amount: number) {
  const firstName = customer.ownerName.split(' ')[0];
  const billText =
    overdueBills.length === 1
      ? `bill ${overdueBills[0].bill.billNumber} (${formatShortDate(overdueBills[0].bill.date)}) for ${formatINR(amount)} is now ${overdueBills[0].days} days overdue`
      : `${overdueBills.length} bills totalling ${formatINR(amount)} are overdue`;
  return `Namaste ${firstName} ji, a reminder from ${MERCHANT_NAME}: ${billText}. You can pay in one tap using the Razorpay payment link below. If there's any issue with this bill, please let us know.`;
}

// Overdue recovery: the agent notices a reminder went unanswered, suggests
// the next one (pre-computed reasoning), and drafts it with a Razorpay
// payment link for the exact amount. Nothing is sent without Aman's tap,
// and in this prototype nothing actually leaves the app.
export function RecoveryReminder({ customer, overdueBills, record, sent, onSend }: RecoveryReminderProps) {
  const amount = overdueBills.reduce((sum, b) => sum + b.remaining, 0);
  const [message, setMessage] = useState(() => draftMessage(customer, overdueBills, amount));
  const [isEditing, setIsEditing] = useState(false);
  const daysSinceReminder = daysSince(record.lastReminderAt.slice(0, 10));

  if (sent) {
    return (
      <Box marginBottom="spacing.7" display="flex" flexDirection="column" gap="spacing.3">
        <Alert
          color="positive"
          title={`Reminder sent on ${sent.channel}`}
          description={`With a Razorpay payment link for ${formatINR(amount)}. Hisaab Agent will follow up in ${record.suggestion.nextFollowUpDays} days if it's still unpaid.`}
          isDismissible={false}
          isFullWidth
        />
        <Box padding="spacing.3" backgroundColor="feedback.background.positive.subtle" borderWidth="thin" borderColor="interactive.border.positive.faded" borderRadius="medium">
          <Text size="small" color="surface.text.gray.muted">
            Sent just now
          </Text>
          <Text size="small" marginTop="spacing.1">
            {sent.message}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      marginBottom="spacing.7"
      padding="spacing.4"
      borderWidth="thin"
      borderColor="surface.border.gray.muted"
      borderRadius="medium"
      display="flex"
      flexDirection="column"
      gap="spacing.4"
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap="spacing.3">
        <Heading size="small">Recover {formatINR(amount)}</Heading>
        <Badge color="notice" icon={ClockIcon}>
          Reminder due
        </Badge>
      </Box>

      <Text size="small" color="surface.text.gray.muted">
        Last reminder sent {daysSinceReminder} days ago on {record.lastChannel} · No payment since
      </Text>

      <Box padding="spacing.3" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
        <Text size="small" color="surface.text.gray.muted">
          Hisaab Agent suggests
        </Text>
        <Text size="small" marginTop="spacing.1">
          {record.suggestion.reasoning}
        </Text>
      </Box>

      <Box>
        <Text size="small" weight="semibold" marginBottom="spacing.2">
          Message to {customer.ownerName}
        </Text>
        {isEditing ? (
          <TextArea
            label="Edit message"
            value={message}
            onChange={({ value }) => setMessage(value ?? '')}
            numberOfLines={5}
          />
        ) : (
          <Box padding="spacing.3" backgroundColor="feedback.background.positive.subtle" borderWidth="thin" borderColor="interactive.border.positive.faded" borderRadius="medium">
            <Text size="small">{message}</Text>
            <Box display="flex" alignItems="center" gap="spacing.2" marginTop="spacing.3">
              <LinkIcon size="small" color="surface.icon.primary.normal" />
              <Text size="small" color="surface.text.primary.normal" weight="semibold">
                Razorpay payment link · {formatINR(amount)}
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      <Box display="flex" gap="spacing.3">
        <Button icon={WhatsAppIcon} onClick={() => onSend(message, 'WhatsApp')}>
          Send on WhatsApp
        </Button>
        <Button variant="secondary" icon={EditIcon} onClick={() => setIsEditing((v) => !v)}>
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </Box>
    </Box>
  );
}
