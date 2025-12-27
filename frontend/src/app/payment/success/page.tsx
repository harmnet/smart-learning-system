"use client";

import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-12 border border-neutral-100 shadow-2xl text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-3">支付成功！</h1>
          <p className="text-neutral-600 mb-8">
            恭喜你成功报名，现在可以开始学习了
          </p>

          <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
            <div className="flex justify-between mb-3">
              <span className="text-sm text-neutral-600">订单号</span>
              <span className="text-sm font-semibold text-neutral-900">ORD202411270001</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-neutral-600">支付金额</span>
              <span className="text-lg font-bold text-blue-600">¥20,800</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">支付时间</span>
              <span className="text-sm font-semibold text-neutral-900">2024-11-27 06:50</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
            >
              开始学习
            </Link>
            <Link
              href="/payment/history"
              className="w-full py-3 border-2 border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              查看订单
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

