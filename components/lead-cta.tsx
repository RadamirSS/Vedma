const TELEGRAM = "https://t.me/Bazhena13witch";

export function LeadCta({
  title = "Не нашли подходящий формат?",
  text = "Напишите Бажене в Telegram — поможет определить направление и подобрать услугу под ваш запрос.",
  buttonLabel = "Написать в Telegram"
}: {
  title?: string;
  text?: string;
  buttonLabel?: string;
}) {
  return (
    <div className="lead-cta">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <a className="btn btn-wine" href={TELEGRAM} target="_blank" rel="noreferrer">
        {buttonLabel}
      </a>
    </div>
  );
}
