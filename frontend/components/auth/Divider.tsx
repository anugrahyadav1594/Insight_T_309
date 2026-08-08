export default function Divider() {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-white/10" />

            <span className="text-xs uppercase tracking-widest text-gray-500">
                OR
            </span>

            <div className="h-px flex-1 bg-white/10" />
        </div>
    );
}