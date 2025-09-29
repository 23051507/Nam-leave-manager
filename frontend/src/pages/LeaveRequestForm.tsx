import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function LeaveRequestForm() {
  const { currentUser, leaveTypes, leaveBalances, submitLeaveRequest } = useAppStore();
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);

  const calculateWorkingDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  };

  const workingDays = calculateWorkingDays(formData.startDate, formData.endDate);
  const selectedLeaveType = leaveTypes.find(lt => lt.id === formData.leaveTypeId);
  const userBalance = userBalances.find(b => b.leaveTypeId === formData.leaveTypeId);

  const canSubmit = () => {
    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate) return false;
    if (selectedLeaveType?.requiresJustification && !formData.reason.trim()) return false;
    if (userBalance && workingDays > userBalance.remaining && !selectedLeaveType?.isExceptional) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;
    const res = submitLeaveRequest({
      leaveTypeId: formData.leaveTypeId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason || undefined
    });
    if (res.ok) {
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Nouvelle demande de congés
          </CardTitle>
          <CardDescription>
            Remplissez le formulaire pour soumettre votre demande
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Type de congé *</Label>
              <Select value={formData.leaveTypeId} onValueChange={(value) => setFormData({ ...formData, leaveTypeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de congé" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => {
                    const balance = userBalances.find(b => b.leaveTypeId === type.id);
                    return (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.name}</span>
                          {balance && (
                            <Badge variant="outline" className="ml-2">
                              {balance.remaining} jours
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {workingDays > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Durée calculée: {workingDays} jour(s) ouvré(s)
                  </span>
                </div>
                {userBalance && !selectedLeaveType?.isExceptional && (
                  <p className="text-sm text-blue-700 mt-1">
                    Solde restant après cette demande: {userBalance.remaining - workingDays} jour(s)
                  </p>
                )}
              </div>
            )}

            {userBalance && workingDays > userBalance.remaining && !selectedLeaveType?.isExceptional && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">
                    Solde insuffisant
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Vous n'avez que {userBalance.remaining} jour(s) disponible(s) pour ce type de congé.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">
                Motif {selectedLeaveType?.requiresJustification && '*'}
              </Label>
              <Textarea
                id="reason"
                placeholder={selectedLeaveType?.requiresJustification
                  ? "Motif obligatoire pour ce type de congé"
                  : "Motif optionnel (ex: vacances en famille)"
                }
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>

            {selectedLeaveType && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Informations sur {selectedLeaveType.name}
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Justificatif: {selectedLeaveType.requiresJustification ? 'Obligatoire' : 'Non requis'}</li>
                  <li>• Type: {selectedLeaveType.isExceptional ? 'Congé exceptionnel' : 'Congé standard'}</li>
                  {selectedLeaveType.maxDays && (
                    <li>• Durée maximale: {selectedLeaveType.maxDays} jours</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={!canSubmit()}
                className="flex-1"
              >
                Soumettre la demande
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}