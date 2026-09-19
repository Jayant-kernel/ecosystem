import React from 'react';

export default function VirtualTeachingHand({ size = 48 }: { size?: number }) {
    return (
        <svg width={size} height={size * 1.18} viewBox="0 0 88 104" aria-hidden="true" className="virtual-teaching-hand">
            <path d="M26 38V16c0-7 4-12 10-12s10 5 10 12v20l1-13c.4-6 4.7-10 10-10 5.8 0 9.3 4.7 9.1 10l-.5 12 1.6-8c1.1-5.6 5.2-8.9 10-8.2 5.7.8 8.1 5.4 7.3 11.2l-3.4 25.7c-2.1 16.4-12.7 29-28.4 32.9-16.4 4.1-34.7-1.1-43.3-12.3-6-7.8-8.8-16.7-8.8-23.9 0-5.5 4-9.3 9-8.8 5 .5 10.2 4.3 16.4 9.9V38Z" fill="#f8dfc5" stroke="#242328" strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M12 56c6.3 2.4 12.2 7.5 18.2 12.2 8.2 6.5 19.4 9.8 30.1 8.1 11.7-1.8 19-8.8 22.8-17.8" fill="none" stroke="#e7b9a6" strokeWidth="4" strokeLinecap="round" opacity=".82" />
            <path d="M66 31c3.2 5.2 3.2 11.2 1.2 17" fill="none" stroke="#fff8ef" strokeWidth="4" strokeLinecap="round" opacity=".9" />
        </svg>
    );
}
