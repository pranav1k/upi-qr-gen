import Head from 'next/head';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { isValidUpiId, validateAmount, buildUpiUri } from '../utils/upi';
import QrCodeDisplay from '../components/QrCodeDisplay';

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

export default function Home() {
  const [data, setData] = useState(null);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('M');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      upiId: '',
      name: '',
      amount: '',
      note: '',
    },
    mode: 'onTouched',
  });

  const currentAmount = watch('amount');

  // Submit handler: validates and sets clean data
  const onSubmit = (formData) => {
    setData({
      upiId: formData.upiId.trim(),
      name: formData.name.trim(),
      amount: formData.amount ? formData.amount.trim() : '',
      note: formData.note ? formData.note.trim() : '',
    });
  };

  const handleReset = () => {
    reset();
    setData(null);
  };

  // Efficiently memoize the generated UPI URI
  const upiUri = useMemo(() => {
    if (!data || !data.upiId) return '';
    try {
      return buildUpiUri(data);
    } catch (err) {
      console.error('Failed to build UPI URI:', err);
      return '';
    }
  }, [data]);

  return (
    <>
      <Head>
        <title>UPI QR Generator - Free, Fast & Spec-Compliant</title>
        <meta
          name="description"
          content="Generate spec-compliant UPI QR codes for GPay, PhonePe, Paytm, BHIM and any UPI app. Fast, private, 100% client-side."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-4xl mx-auto w-full">
          <header className="text-center m-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              UPI QR Code Generator
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Generate scannable UPI QR codes instantly for any UPI app.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-7">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Payment Details
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="upiId" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      UPI ID (VPA) <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    id="upiId"
                    type="text"
                    autoComplete="off"
                    placeholder="merchant@upi or 9876543210@paytm"
                    className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.upiId
                        ? 'border-red-500 ring-red-500/20 bg-red-50/50 dark:bg-red-950/20 text-gray-900 dark:text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    {...register('upiId', {
                      required: 'UPI ID is required',
                      validate: (value) =>
                        isValidUpiId(value) || 'Enter a valid UPI ID (e.g. user@bank, 9876543210@paytm)',
                    })}
                  />
                  {errors.upiId && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.upiId.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Payee Name <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Rahul Sharma or Fresh Grocery"
                    className={`w-full p-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-500 ring-red-500/20 bg-red-50/50 dark:bg-red-950/20 text-gray-900 dark:text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    {...register('name', {
                      required: 'Payee name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Amount in INR (Optional)
                    </label>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">Leave blank for any amount</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className={`w-full pl-8 p-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.amount
                          ? 'border-red-500 ring-red-500/20 bg-red-50/50 dark:bg-red-950/20 text-gray-900 dark:text-white'
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                      {...register('amount', {
                        validate: (value) => {
                          const res = validateAmount(value);
                          return res.valid || res.error;
                        },
                      })}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.amount.message}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-gray-600 dark:text-gray-400 mr-1">Quick:</span>
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setValue('amount', String(amt), { shouldValidate: true })}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          String(currentAmount) === String(amt)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                    {currentAmount && (
                      <button
                        type="button"
                        onClick={() => setValue('amount', '', { shouldValidate: true })}
                        className="text-xs px-2 py-1 text-red-500 hover:text-red-600 font-medium transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="note" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Transaction Note (Optional)
                    </label>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">e.g. Dinner, Rent, Self, etc</span>
                  </div>
                  <input
                    id="note"
                    type="text"
                    maxLength={80}
                    placeholder="Payment remarks or reference"
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    {...register('note', {
                      maxLength: { value: 80, message: 'Note cannot exceed 80 characters' },
                    })}
                  />
                  {errors.note && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.note.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      QR Density / Error Correction:
                    </span>
                    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setErrorCorrectionLevel('M')}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                          errorCorrectionLevel === 'M'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        title="Medium redundancy (15%). Fewer dots, faster camera detection."
                      >
                        Fast Scan (15%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setErrorCorrectionLevel('H')}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                          errorCorrectionLevel === 'H'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        title="High redundancy (30%). Resistant to physical wear or print damage."
                      >
                        High Redundancy (30%)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-indigo-600 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Generate QR Code
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl transition-all border border-gray-200 dark:border-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center">
              {data && upiUri ? (
                <QrCodeDisplay
                  data={data}
                  upiUri={upiUri}
                  errorCorrectionLevel={errorCorrectionLevel}
                />
              ) : (
                <div className="w-full max-w-md mx-auto bg-white/60 dark:bg-gray-900/40 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[360px]">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    No QR Code Generated Yet
                  </h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                    Fill in your UPI ID and name in the form, then click &ldquo;Generate QR Code&rdquo; to preview and download your code.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <span>100% Client-Side btw</span>
          </div>
        </footer>
      </main>
    </>
  );
}
