import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function NotificationItem({ notification }) {
  const getMessage = (type) => {
    switch (type) {
      case "LIKE": return "curtiu seu treino ❤️"
      case "FOLLOW": return "começou a te seguir 👀"
      case "COMMENT": return "comentou no seu post 💬"
      default: return "enviou uma interação"
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors border-b border-white/5 ${!notification.is_read ? 'bg-green-500/5' : ''}`}
    >
      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-green-500/30 overflow-hidden flex-shrink-0">
        {notification.from_user?.foto ? (
          <img src={notification.from_user.foto} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px]">SQUAD</div>
        )}
      </div>
      
      <div className="flex-1 text-xs text-left">
        <p className="text-white leading-tight">
          <span className="font-black italic uppercase">@{notification.from_user?.username || 'membro'}</span>
          {" "}{getMessage(notification.type)}
        </p>
        <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tighter">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </motion.div>
  )
}