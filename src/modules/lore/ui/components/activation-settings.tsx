'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TagInput } from './tag-input'
import { Info, Key, Target, Clock, Filter, Coins } from 'lucide-react'

export type ActivationMode = 'keyword' | 'vector' | 'hybrid' | 'constant' | 'disabled'
export type KeywordsLogic = 'AND_ANY' | 'AND_ALL' | 'NOT_ALL' | 'NOT_ANY'
export type Position = 'before_character' | 'after_character' | 'before_examples' | 'after_examples' | 'at_depth' | 'system_top' | 'system_bottom'
export type MessageRole = 'system' | 'user' | 'assistant'

export interface ActivationSettingsValue {
  activation_mode: ActivationMode
  primary_keys?: string[]
  secondary_keys?: string[]
  keywords_logic?: KeywordsLogic
  case_sensitive?: boolean
  match_whole_words?: boolean
  use_regex?: boolean
  vector_similarity_threshold?: number
  max_vector_results?: number
  probability?: number
  use_probability?: boolean
  scan_depth?: number
  match_in_user_messages?: boolean
  match_in_bot_messages?: boolean
  match_in_system_prompts?: boolean
}

export interface PositioningValue {
  position?: Position
  depth?: number
  role?: MessageRole
  order?: number
}

export interface AdvancedActivationValue {
  sticky?: number
  cooldown?: number
  delay?: number
}

export interface FilteringValue {
  filter_by_bots?: boolean
  allowed_bot_ids?: number[]
  excluded_bot_ids?: number[]
  filter_by_personas?: boolean
  allowed_persona_ids?: number[]
  excluded_persona_ids?: number[]
}

export interface BudgetControlValue {
  ignore_budget?: boolean
  max_tokens?: number
}

interface ActivationSettingsProps {
  activationSettings: ActivationSettingsValue
  positioning: PositioningValue
  advancedActivation: AdvancedActivationValue
  filtering: FilteringValue
  budgetControl: BudgetControlValue
  onActivationSettingsChange: (value: ActivationSettingsValue) => void
  onPositioningChange: (value: PositioningValue) => void
  onAdvancedActivationChange: (value: AdvancedActivationValue) => void
  onFilteringChange: (value: FilteringValue) => void
  onBudgetControlChange: (value: BudgetControlValue) => void
}

export const ActivationSettings = ({
  activationSettings,
  positioning,
  advancedActivation,
  filtering,
  budgetControl,
  onActivationSettingsChange,
  onPositioningChange,
  onAdvancedActivationChange,
  onFilteringChange,
  onBudgetControlChange,
}: ActivationSettingsProps) => {
  const mode = activationSettings.activation_mode
  const showKeywordSettings = mode === 'keyword' || mode === 'hybrid'
  const showVectorSettings = mode === 'vector' || mode === 'hybrid'

  const getModeIcon = (mode: ActivationMode) => {
    switch (mode) {
      case 'keyword': return '🔑'
      case 'vector': return '🎯'
      case 'hybrid': return '🔀'
      case 'constant': return '⭐'
      case 'disabled': return '⛔'
    }
  }

  return (
    <Accordion type="multiple" className="w-full">
      {/* Activation Settings */}
      <AccordionItem value="activation" className="border-gold-ancient/30">
        <AccordionTrigger className="text-parchment hover:text-gold-rich">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            <span>Activation Settings</span>
            <Badge variant="outline" className="ml-2 border-gold-ancient/30 text-gold-rich">
              {getModeIcon(mode)} {mode}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Activation Mode */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-parchment">Activation Mode</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-parchment/50" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Keyword:</strong> Activates when keywords are found<br/>
                      <strong>Vector:</strong> Activates by semantic similarity<br/>
                      <strong>Hybrid:</strong> Both keyword and vector<br/>
                      <strong>Constant:</strong> Always active<br/>
                      <strong>Disabled:</strong> Never activates
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={mode}
              onValueChange={(value) => onActivationSettingsChange({ ...activationSettings, activation_mode: value as ActivationMode })}
            >
              <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-rune border-gold-ancient/30">
                <SelectItem value="keyword">🔑 Keyword Only</SelectItem>
                <SelectItem value="vector">🎯 Vector Only (Semantic)</SelectItem>
                <SelectItem value="hybrid">🔀 Hybrid (Keyword OR Vector)</SelectItem>
                <SelectItem value="constant">⭐ Constant (Always Active)</SelectItem>
                <SelectItem value="disabled">⛔ Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keyword Settings */}
          {showKeywordSettings && (
            <div className="space-y-4 pl-4 border-l-2 border-gold-ancient/20">
              <h4 className="text-sm font-semibold text-gold-rich">Keyword Activation</h4>

              {/* Primary Keywords */}
              <div className="space-y-2">
                <Label className="text-parchment">Primary Keywords</Label>
                <TagInput
                  value={activationSettings.primary_keys || []}
                  onChange={(tags) => onActivationSettingsChange({ ...activationSettings, primary_keys: tags })}
                  placeholder="dragon, castle, magic"
                />
              </div>

              {/* Secondary Keywords */}
              <div className="space-y-2">
                <Label className="text-parchment">Secondary Keywords (Optional)</Label>
                <TagInput
                  value={activationSettings.secondary_keys || []}
                  onChange={(tags) => onActivationSettingsChange({ ...activationSettings, secondary_keys: tags })}
                  placeholder="fire, scales, wings"
                />
              </div>

              {/* Keywords Logic */}
              <div className="space-y-2">
                <Label className="text-parchment">Match Logic</Label>
                <Select
                  value={activationSettings.keywords_logic || 'AND_ANY'}
                  onValueChange={(value) => onActivationSettingsChange({ ...activationSettings, keywords_logic: value as KeywordsLogic })}
                >
                  <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-rune border-gold-ancient/30">
                    <SelectItem value="AND_ANY">Match ANY keyword</SelectItem>
                    <SelectItem value="AND_ALL">Match ALL keywords</SelectItem>
                    <SelectItem value="NOT_ALL">Exclude if ALL match</SelectItem>
                    <SelectItem value="NOT_ANY">Exclude if ANY match</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Keyword Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-parchment text-sm">Case Sensitive</Label>
                  <Switch
                    checked={activationSettings.case_sensitive || false}
                    onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, case_sensitive: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-parchment text-sm">Match Whole Words</Label>
                  <Switch
                    checked={activationSettings.match_whole_words || false}
                    onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, match_whole_words: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-parchment text-sm">Use Regex Patterns</Label>
                  <Switch
                    checked={activationSettings.use_regex || false}
                    onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, use_regex: checked })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vector Settings */}
          {showVectorSettings && (
            <div className="space-y-4 pl-4 border-l-2 border-gold-ancient/20">
              <h4 className="text-sm font-semibold text-gold-rich">Vector Activation</h4>

              {/* Similarity Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-parchment">Similarity Threshold</Label>
                  <span className="text-sm text-gold-rich">
                    {((activationSettings.vector_similarity_threshold || 0.7) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(activationSettings.vector_similarity_threshold || 0.7) * 100]}
                  onValueChange={([value]) => onActivationSettingsChange({ ...activationSettings, vector_similarity_threshold: value / 100 })}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-gold-rich"
                />
                <p className="text-xs text-parchment/50">
                  Higher = more selective, Lower = more permissive
                </p>
              </div>

              {/* Max Results */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-parchment">Max Results</Label>
                  <span className="text-sm text-gold-rich">
                    {activationSettings.max_vector_results || 5}
                  </span>
                </div>
                <Slider
                  value={[activationSettings.max_vector_results || 5]}
                  onValueChange={([value]) => onActivationSettingsChange({ ...activationSettings, max_vector_results: value })}
                  min={1}
                  max={20}
                  step={1}
                  className="[&_[role=slider]]:bg-gold-rich"
                />
              </div>
            </div>
          )}

          {/* Scan Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gold-rich">Scan Settings</h4>

            {/* Scan Depth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-parchment">Scan Depth (messages)</Label>
                <span className="text-sm text-gold-rich">
                  {activationSettings.scan_depth || 2}
                </span>
              </div>
              <Slider
                value={[activationSettings.scan_depth || 2]}
                onValueChange={([value]) => onActivationSettingsChange({ ...activationSettings, scan_depth: value })}
                min={1}
                max={10}
                step={1}
                className="[&_[role=slider]]:bg-gold-rich"
              />
            </div>

            {/* Match In */}
            <div className="space-y-2">
              <Label className="text-parchment text-sm">Scan In:</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-parchment">User Messages</span>
                  <Switch
                    checked={activationSettings.match_in_user_messages ?? true}
                    onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, match_in_user_messages: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-parchment">Bot Messages</span>
                  <Switch
                    checked={activationSettings.match_in_bot_messages ?? true}
                    onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, match_in_bot_messages: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-parchment">System Prompts</span>
                  <Switch
                    checked={activationSettings.match_in_system_prompts ?? false}
                    onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, match_in_system_prompts: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-parchment">Activation Probability</Label>
                <Switch
                  checked={activationSettings.use_probability || false}
                  onCheckedChange={(checked) => onActivationSettingsChange({ ...activationSettings, use_probability: checked })}
                />
              </div>
              {activationSettings.use_probability && (
                <>
                  <Slider
                    value={[activationSettings.probability || 100]}
                    onValueChange={([value]) => onActivationSettingsChange({ ...activationSettings, probability: value })}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-gold-rich"
                  />
                  <p className="text-xs text-parchment/50">
                    {activationSettings.probability || 100}% chance to activate when matched
                  </p>
                </>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Positioning */}
      <AccordionItem value="positioning" className="border-gold-ancient/30">
        <AccordionTrigger className="text-parchment hover:text-gold-rich">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Positioning</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Position */}
          <div className="space-y-2">
            <Label className="text-parchment">Insert Position</Label>
            <Select
              value={positioning.position || 'before_character'}
              onValueChange={(value) => onPositioningChange({ ...positioning, position: value as Position })}
            >
              <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-rune border-gold-ancient/30">
                <SelectItem value="system_top">System Top (Very Beginning)</SelectItem>
                <SelectItem value="before_character">Before Character Card</SelectItem>
                <SelectItem value="after_character">After Character Card</SelectItem>
                <SelectItem value="before_examples">Before Examples</SelectItem>
                <SelectItem value="after_examples">After Examples</SelectItem>
                <SelectItem value="at_depth">At Specific Depth</SelectItem>
                <SelectItem value="system_bottom">System Bottom (Very End)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* At Depth Settings */}
          {positioning.position === 'at_depth' && (
            <div className="space-y-4 pl-4 border-l-2 border-gold-ancient/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-parchment">Depth (from end)</Label>
                  <span className="text-sm text-gold-rich">{positioning.depth || 0}</span>
                </div>
                <Slider
                  value={[positioning.depth || 0]}
                  onValueChange={([value]) => onPositioningChange({ ...positioning, depth: value })}
                  min={0}
                  max={20}
                  step={1}
                  className="[&_[role=slider]]:bg-gold-rich"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-parchment">Message Role</Label>
                <Select
                  value={positioning.role || 'system'}
                  onValueChange={(value) => onPositioningChange({ ...positioning, role: value as MessageRole })}
                >
                  <SelectTrigger className="glass-rune border-gold-ancient/30 text-parchment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-rune border-gold-ancient/30">
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Order */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-parchment">Priority Order</Label>
              <span className="text-sm text-gold-rich">{positioning.order || 100}</span>
            </div>
            <Slider
              value={[positioning.order || 100]}
              onValueChange={([value]) => onPositioningChange({ ...positioning, order: value })}
              min={0}
              max={1000}
              step={10}
              className="[&_[role=slider]]:bg-gold-rich"
            />
            <p className="text-xs text-parchment/50">
              Lower numbers appear first
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Advanced Activation */}
      <AccordionItem value="advanced" className="border-gold-ancient/30">
        <AccordionTrigger className="text-parchment hover:text-gold-rich">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Advanced Activation</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Sticky */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-parchment">Sticky (messages)</Label>
              <span className="text-sm text-gold-rich">{advancedActivation.sticky || 0}</span>
            </div>
            <Slider
              value={[advancedActivation.sticky || 0]}
              onValueChange={([value]) => onAdvancedActivationChange({ ...advancedActivation, sticky: value })}
              min={0}
              max={20}
              step={1}
              className="[&_[role=slider]]:bg-gold-rich"
            />
            <p className="text-xs text-parchment/50">
              Stay active for N messages after activation (0 = disabled)
            </p>
          </div>

          {/* Cooldown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-parchment">Cooldown (messages)</Label>
              <span className="text-sm text-gold-rich">{advancedActivation.cooldown || 0}</span>
            </div>
            <Slider
              value={[advancedActivation.cooldown || 0]}
              onValueChange={([value]) => onAdvancedActivationChange({ ...advancedActivation, cooldown: value })}
              min={0}
              max={20}
              step={1}
              className="[&_[role=slider]]:bg-gold-rich"
            />
            <p className="text-xs text-parchment/50">
              Wait N messages before can activate again (0 = disabled)
            </p>
          </div>

          {/* Delay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-parchment">Delay (until message)</Label>
              <span className="text-sm text-gold-rich">{advancedActivation.delay || 0}</span>
            </div>
            <Slider
              value={[advancedActivation.delay || 0]}
              onValueChange={([value]) => onAdvancedActivationChange({ ...advancedActivation, delay: value })}
              min={0}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-gold-rich"
            />
            <p className="text-xs text-parchment/50">
              Don't activate until message #N (0 = immediate)
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Budget Control */}
      <AccordionItem value="budget" className="border-gold-ancient/30">
        <AccordionTrigger className="text-parchment hover:text-gold-rich">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            <span>Budget Control</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Ignore Budget */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-parchment">Ignore Token Budget</Label>
              <p className="text-xs text-parchment/50">
                Always include even if budget exceeded
              </p>
            </div>
            <Switch
              checked={budgetControl.ignore_budget || false}
              onCheckedChange={(checked) => onBudgetControlChange({ ...budgetControl, ignore_budget: checked })}
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-parchment">Max Tokens (per entry)</Label>
              <span className="text-sm text-gold-rich">{budgetControl.max_tokens || 1000}</span>
            </div>
            <Slider
              value={[budgetControl.max_tokens || 1000]}
              onValueChange={([value]) => onBudgetControlChange({ ...budgetControl, max_tokens: value })}
              min={100}
              max={4000}
              step={100}
              className="[&_[role=slider]]:bg-gold-rich"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
