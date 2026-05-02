import Icon from "./Icon";
import type { Owner } from "@/lib/types";

export default function OwnerCard({ owner }: { owner: Owner }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200">
          {owner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.avatarUrl} alt={owner.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Listed by</p>
          <h3 className="truncate font-semibold">{owner.name}</h3>
          <p className="text-xs text-ink-muted">
            Member since {new Date(owner.memberSince).getFullYear()} · {owner.listingsCount} listings
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center">
        <div>
          <p className="text-lg font-bold">{owner.responseRate}%</p>
          <p className="text-xs text-ink-muted">Response rate</p>
        </div>
        <div>
          <p className="text-lg font-bold">{owner.listingsCount}</p>
          <p className="text-xs text-ink-muted">Active listings</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <a href={`tel:${owner.phoneNumber.replace(/\s/g, "")}`} className="btn-primary w-full">
          <Icon name="phone" className="h-4 w-4" />
          {owner.phoneNumber}
        </a>
        <button type="button" className="btn-secondary w-full">
          <Icon name="message" className="h-4 w-4" />
          Send a message
        </button>
      </div>
    </div>
  );
}
