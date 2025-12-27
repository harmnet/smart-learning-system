"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'card'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);

  const order = {
    id: 'ORD202411270001',
    major: '计算机科学与技术',
    type: '专业学费',
    years: 4,
    pricePerYear: 5200,
    totalAmount: 20800,
    discount: 0,
    finalAmount: 20800
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      alert('支付成功！');
      router.push('/payment/success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Smart Learning</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-2xl p-8 border border-neutral-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">订单信息</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-600">订单号</span>
                  <span className="font-semibold text-neutral-900">{order.id}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-600">报读专业</span>
                  <span className="font-semibold text-neutral-900">{order.major}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-600">学制</span>
                  <span className="font-semibold text-neutral-900">{order.years}年</span>
                </div>
                <div className="flex justify-between py-3 border-b border-neutral-100">
                  <span className="text-neutral-600">学费标准</span>
                  <span className="font-semibold text-neutral-900">¥{order.pricePerYear}/年</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-8 border border-neutral-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">支付方式</h2>
              <div className="grid gap-4">
                {[
                  { id: 'wechat', name: '微信支付', icon: '💚', desc: '推荐使用' },
                  { id: 'alipay', name: '支付宝', icon: '💙', desc: '快捷安全' },
                  { id: 'card', name: '银行卡', icon: '💳', desc: '支持储蓄卡' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                      paymentMethod === method.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-neutral-900">{method.name}</div>
                      <div className="text-sm text-neutral-500">{method.desc}</div>
                    </div>
                    {paymentMethod === method.id && (
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 sticky top-24">
              <h3 className="font-bold text-neutral-900 mb-6">订单摘要</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">学费小计</span>
                  <span className="font-semibold text-neutral-900">¥{order.totalAmount}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">优惠</span>
                    <span className="font-semibold text-blue-600">-¥{order.discount}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-neutral-200">
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-600">应付金额</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">¥{order.finalAmount}</div>
                      <div className="text-xs text-neutral-500 mt-1">({order.years}年学费)</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isProcessing ? '处理中...' : '立即支付'}
              </button>

              <div className="text-xs text-neutral-500 text-center">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                支付信息已加密保护
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

