import { Button } from '@/components/ui/button';

export function JourneyPaymentButton({ amount, onConfirm }: { amount: number | null; onConfirm: () => void }) {
  return (
    <Button
      onClick={onConfirm}
      disabled={amount === null}
      className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
    >
      {amount === null ? 'Price unavailable' : `Confirm and Pay ₹${amount.toLocaleString()}`}
    </Button>
  );
}
