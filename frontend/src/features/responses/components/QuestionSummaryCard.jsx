import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const QUESTION_TYPE_LABELS = {
    short_text: 'Short text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
};

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#6366F1'];

const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || 'Short text';

const QuestionSummaryCard = ({ question, totalResponses, optionCounts }) => {
    const label = question?.label || 'Untitled question';
    const type = question?.type || 'short_text';
    const typeLabel = getQuestionTypeLabel(type);
    const showOptions = Array.isArray(optionCounts) && optionCounts.length > 0;

    return (
        <div className="rounded-xl border border-default bg-secondary shadow-sm p-6 mb-4">
            <div className="flex flex-col gap-1 mb-6">
                <h3 className="text-base font-medium text-primary">{label}</h3>
                <div className="text-sm text-secondary">
                    {totalResponses} responses
                </div>
            </div>
            {showOptions && (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 min-w-[200px] h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={optionCounts}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="option"
                                >
                                    {optionCounts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '6px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        {optionCounts.map((option, index) => {
                            const isLast = index === optionCounts.length - 1;
                            const percentage = totalResponses > 0 ? Math.round((option.count / totalResponses) * 100) : 0;
                            return (
                                <div
                                    key={`${option.option}-${index}`}
                                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 ${isLast ? '' : 'border-b border-default'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-3 h-3 rounded-full shrink-0" 
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                                        />
                                        <span className="text-sm text-primary">{option.option}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                        <span className="text-sm text-secondary">{percentage}%</span>
                                        <span className="text-sm font-medium bg-tertiary px-2 py-1 rounded text-primary border border-default shadow-sm min-w-[32px] text-center">{option.count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionSummaryCard;
