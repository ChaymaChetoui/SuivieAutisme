// src/components/common/Card.jsx
import { clsx } from 'clsx';

const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border p-6',
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;