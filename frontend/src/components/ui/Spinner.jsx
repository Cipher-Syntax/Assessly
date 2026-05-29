const SIZE_MAP = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-9 w-9',
};

const Spinner = ({ size = 'sm', className = '' }) => {
    const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

    return (
        <span
            role="status"
            aria-live="polite"
            className={`inline-block animate-spin rounded-full border-2 border-default border-t-transparent ${sizeClass} ${className}`}
        />
    );
};

export default Spinner;
