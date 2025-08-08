'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Condition, TriggerParameter, ConditionOperator } from '@/lib/automations/types';
import { getOperatorsForType } from '@/lib/automations/condition-evaluator';

interface ConditionBuilderProps {
  condition: Condition;
  parameters: TriggerParameter[];
  onChange: (condition: Condition) => void;
}

export function ConditionBuilder({ condition, parameters, onChange }: ConditionBuilderProps) {
  const selectedParam = parameters.find(p => p.name === condition.field);
  const paramType = selectedParam?.type || 'string';
  const availableOperators = getOperatorsForType(paramType);

  const getOperatorLabel = (operator: ConditionOperator): string => {
    const labels: Record<ConditionOperator, string> = {
      'equals': 'equals',
      'not_equals': 'not equals',
      'greater_than': 'greater than',
      'less_than': 'less than',
      'greater_than_or_equal': 'greater than or equal',
      'less_than_or_equal': 'less than or equal',
      'contains': 'contains',
      'not_contains': 'does not contain',
      'is_empty': 'is empty',
      'is_not_empty': 'is not empty',
      'in': 'is in',
      'not_in': 'is not in',
    };
    return labels[operator] || operator;
  };

  const renderValueInput = () => {
    // No value input needed for these operators
    if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
      return null;
    }

    // If parameter has possible values, show as select
    if (selectedParam?.possibleValues && selectedParam.possibleValues.length > 0) {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => onChange({ ...condition, value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {selectedParam.possibleValues.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For boolean type
    if (paramType === 'boolean') {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => onChange({ ...condition, value: value === 'true' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // For in/not_in operators, allow comma-separated values
    if (condition.operator === 'in' || condition.operator === 'not_in') {
      return (
        <Input
          type="text"
          value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
          onChange={(e) => {
            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
            onChange({ ...condition, value: values });
          }}
          placeholder="Enter comma-separated values"
        />
      );
    }

    // Default input based on type
    return (
      <Input
        type={paramType === 'number' ? 'number' : 'text'}
        value={condition.value}
        onChange={(e) => {
          const value = paramType === 'number' ? Number(e.target.value) : e.target.value;
          onChange({ ...condition, value });
        }}
        placeholder={`Enter ${paramType} value`}
      />
    );
  };

  return (
    <div className="flex gap-2">
      <Select
        value={condition.field}
        onValueChange={(field) => onChange({ ...condition, field })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {parameters.map((param) => (
            <SelectItem key={param.name} value={param.name}>
              {param.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(operator: ConditionOperator) => onChange({ ...condition, operator })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((operator) => (
            <SelectItem key={operator} value={operator}>
              {getOperatorLabel(operator)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1">
        {renderValueInput()}
      </div>
    </div>
  );
}