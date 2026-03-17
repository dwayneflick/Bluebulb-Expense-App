export const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Diamond Bank", "Ecobank", "Fidelity Bank", 
  "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Globus Bank", 
  "GTBank (Guaranty Trust Bank)", "Heritage Bank", "Keystone Bank", "Kuda Bank", 
  "Lotus Bank", "Opay", "Paga", "PalmPay", "Polaris Bank", "Providus Bank", 
  "Stanbic IBTC Bank", "Standard Chartered Bank", "Sterling Bank", "SunTrust Bank", 
  "Titan Trust Bank", "Union Bank of Nigeria", "United Bank for Africa (UBA)", 
  "Unity Bank", "VFD Microfinance Bank", "Wema Bank", "Zenith Bank"
];

export const EXPENSE_TYPES = [
  "Travel", "Accommodation", "Meals", "Office Supplies", 
  "Equipment", "Training", "Medical", "Others"
];

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
}
