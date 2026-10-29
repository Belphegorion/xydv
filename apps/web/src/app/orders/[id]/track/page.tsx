'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowSquareOut,
  ArrowLeft,
  WarningCircle,
  Pulse,
} from '@phosphor-icons/react';
import type { OrderStatus, OrderTimelineResponse, OrderStatusEvent } from '@vertex/types';

const STEPS: {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}[] = [
  { status: 'placed', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

function getStepIndex(status: OrderStatus): number {
  if (status === 'pending') return 0;
  if (status === 'placed') return 0;
  if (status === 'confirmed') return 1;
  if (status === 'processing') return 2;
  if (status === 'packed') return 2;
  if (status === 'shipped') return 3;
  if (status === 'out_for_delivery') return 4;
  if (status === 'delivered') return 5;
  if (status === 'cancelled') return -1;
  return 0;
}

export default function OrderTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [timelineData, setTimelineData] = useState<OrderTimelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    // Initial REST fetch for immediate hydration
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/timeline`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load tracking details.');
        }
        if (isMounted) {
          setTimelineData(json.data);
          setIsLoading(false);
          setLastAnnouncement(`Order status is ${json.data.currentStatus}.`);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Unable to load timeline.';
          setError(msg);
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    // Establish Server-Sent Events stream
    try {
      eventSource = new EventSource(`/api/orders/${orderId}/stream`);

      eventSource.onopen = () => {
        if (isMounted) setIsConnected(true);
      };

      eventSource.addEventListener('initial_state', (e) => {
        if (!isMounted) return;
        try {
          const data: OrderTimelineResponse = JSON.parse(e.data);
          setTimelineData(data);
          setIsConnected(true);
        } catch {}
      });

      eventSource.addEventListener('order_update', (e) => {
        if (!isMounted) return;
        try {
          const newEvent: OrderStatusEvent = JSON.parse(e.data);
          setTimelineData((prev) => {
            if (!prev) return prev;
            const existingEvents = prev.events || prev.timeline || [];
            const updatedEvents = [...existingEvents.filter((ev) => ev._id !== newEvent._id), newEvent];
            return {
              ...prev,
              currentStatus: newEvent.status,
              carrier: newEvent.carrier || prev.carrier,
              trackingNumber: newEvent.trackingNumber || prev.trackingNumber,
              trackingUrl: newEvent.trackingUrl || prev.trackingUrl,
              estimatedDelivery: newEvent.estimatedDelivery || prev.estimatedDelivery,
              events: updatedEvents,
              timeline: updatedEvents,
            };
          });
          setLastAnnouncement(`Order updated: status is now ${newEvent.status}.`);
        } catch {}
      });

      eventSource.onerror = () => {
        if (isMounted) setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [orderId]);

  const currentStatus = timelineData?.currentStatus || 'placed';
  const isCancelled = currentStatus === 'cancelled';
  const activeStepIdx = getStepIndex(currentStatus);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Hidden live region for accessibility announcements */}
      <div aria-live="polite" className="sr-only">
        {lastAnnouncement}
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft size={14} />
            <span>Back to Account</span>
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E8FF00] block mb-1">
                DISPATCH TRACKING
              </span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Order #{orderId.slice(-8).toUpperCase()}
              </h1>
            </div>

            {/* Live SSE Connection Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-[#E8FF00] animate-ping' : 'bg-zinc-600'
                }`}
              />
              <span className={isConnected ? 'text-[#E8FF00]' : 'text-zinc-500'}>
                {isConnected ? 'LIVE FEED' : 'CONNECTING...'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="p-8 text-center bg-[#0A0A0A] border border-[#1F1F1F] font-mono text-xs text-zinc-400">
            Establishing encrypted telemetry link...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <WarningCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Status Stepper Card */}
            <div className="p-6 sm:p-8 bg-[#0A0A0A] border border-[#1F1F1F]">
              {isCancelled ? (
                <div className="p-4 bg-red-950/30 border border-red-800/50 text-red-400 text-sm font-mono flex items-center gap-2">
                  <WarningCircle size={20} />
                  <span>This order has been cancelled.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-xs font-mono uppercase">
                    <span className="text-zinc-400">Current Phase:</span>
                    <span className="text-[#E8FF00] font-bold tracking-wider">{currentStatus}</span>
                  </div>

                  {/* Horizontal / Wrapped Progress Track */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {STEPS.map((step, idx) => {
                      const isComplete = idx <= activeStepIdx;
                      const isCurrent = idx === activeStepIdx;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.status}
                          className={`p-3 border transition-colors ${
                            isCurrent
                              ? 'border-[#E8FF00] bg-[#E8FF00]/10 text-white'
                              : isComplete
                              ? 'border-zinc-700 bg-zinc-900/60 text-zinc-300'
                              : 'border-zinc-900 bg-zinc-950/40 text-zinc-600'
                          }`}
                          aria-current={isCurrent ? 'step' : undefined}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <StepIcon
                              size={16}
                              className={isCurrent ? 'text-[#E8FF00]' : isComplete ? 'text-zinc-300' : 'text-zinc-600'}
                            />
                            <span className="text-[10px] font-mono text-zinc-500">0{idx + 1}</span>
                          </div>
                          <span className="text-xs font-mono uppercase font-bold block leading-tight">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Carrier & Shipment Metadata Card */}
            {(timelineData?.carrier || timelineData?.trackingNumber || timelineData?.estimatedDelivery) && (
              <div className="p-6 bg-[#0A0A0A] border border-[#1F1F1F] grid sm:grid-cols-3 gap-4">
                {timelineData.carrier && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Carrier Partner
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {timelineData.carrier}
                    </span>
                  </div>
                )}

                {timelineData.trackingNumber && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Tracking Number / AWB
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-[#E8FF00]">
                        {timelineData.trackingNumber}
                      </span>
                      {timelineData.trackingUrl && (
                        <a
                          href={timelineData.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-white transition-colors"
                          aria-label="Open tracking on carrier website"
                        >
                          <ArrowSquareOut size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {timelineData.estimatedDelivery && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Estimated Delivery
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {new Date(timelineData.estimatedDelivery).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Timeline Events Log */}
            <div className="p-6 sm:p-8 bg-[#0A0A0A] border border-[#1F1F1F] space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
                Milestone Telemetry
              </h2>

              <div className="relative border-l border-zinc-800 ml-3 pl-6 space-y-6">
                {(timelineData?.events || []).map((evt, idx) => (
                  <div key={evt._id || idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-zinc-900 border border-[#E8FF00]" />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-white">
                        {evt.status.replace(/_/g, ' ')}
                      </span>
                      <time className="text-[10px] font-mono text-zinc-500">
                        {new Date(evt.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {evt.note && (
                      <p className="text-xs text-zinc-400 mt-1 font-mono">
                        {evt.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
