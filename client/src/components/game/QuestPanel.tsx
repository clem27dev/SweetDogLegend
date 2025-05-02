import { useEffect } from "react";
import { useQuests } from "@/lib/stores/useQuests";
import { QuestType } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const QuestPanel = () => {
  const { quests, fetchQuests, completeQuest } = useQuests();
  
  useEffect(() => {
    fetchQuests();
  }, []);
  
  // Group quests by type
  const questsByType = quests.reduce((acc, quest) => {
    const type = quest.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(quest);
    return acc;
  }, {} as Record<string, typeof quests>);
  
  if (quests.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-6 text-center">
          <i className="fas fa-scroll text-4xl text-muted-foreground mb-3"></i>
          <h3 className="mb-2">No Active Quests</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for new quests from Princess Ayana!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="quests-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(questsByType).map(([type, typeQuests]) => (
          <div key={type} className="quest-type-group">
            <h3 className="mb-2 flex items-center">
              <i className={`fas fa-${getQuestTypeIcon(type as QuestType)} mr-2`}></i>
              {getQuestTypeLabel(type as QuestType)}
            </h3>
            
            {typeQuests.map((quest) => {
              const progressPercentage = Math.min(100, (quest.progress / quest.target) * 100);
              const canComplete = quest.progress >= quest.target && !quest.completed;
              return (
                <Card key={quest.id} className={`quest-card mb-3 ${quest.completed ? 'completed' : ''} ${canComplete ? 'can-complete' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{getQuestDescription(quest.type, quest.target)}</CardTitle>
                      {quest.completed && <Badge variant="outline">Completed</Badge>}
                    </div>
                    <CardDescription>
                      Progress: {quest.progress}/{quest.target}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <Progress value={progressPercentage} className="h-2 mb-2" />
                    
                    <div className="quest-rewards text-xs">
                      <div className="flex justify-between">
                        <div className="reward">
                          <i className="fas fa-drumstick-bite text-amber-500 mr-1"></i>
                          {quest.rewards.plk} PLK
                        </div>
                        <div className="reward">
                          <i className="fas fa-coins text-yellow-500 mr-1"></i>
                          {quest.rewards.lor} Lor
                        </div>
                        <div className="reward">
                          <i className="fas fa-gem text-purple-500 mr-1"></i>
                          {quest.rewards.gems} Gems
                        </div>
                        <div className="reward">
                          <i className="fas fa-star text-blue-500 mr-1"></i>
                          {quest.rewards.exp} XP
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      onClick={() => completeQuest(quest.id)} 
                      disabled={!canComplete}
                      size="sm"
                      className="w-full"
                    >
                      {canComplete ? (
                        <>
                          <i className="fas fa-check-circle mr-2"></i> Claim Rewards
                        </>
                      ) : quest.completed ? (
                        <>
                          <i className="fas fa-check mr-2"></i> Completed
                        </>
                      ) : (
                        <>
                          <i className="fas fa-hourglass-half mr-2"></i> In Progress
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
const getQuestTypeIcon = (type: QuestType): string => {
  switch (type) {
    case QuestType.FEED_DOG: return "bone";
    case QuestType.PET_DOG: return "hand-sparkles";
    case QuestType.TRAIN_DOG: return "dumbbell";
    case QuestType.WIN_COMBAT: return "swords";
    case QuestType.JOIN_GROUP: return "users";
    case QuestType.SEND_MESSAGE: return "comment";
    default: return "scroll";
  }
};

const getQuestTypeLabel = (type: QuestType): string => {
  switch (type) {
    case QuestType.FEED_DOG: return "Feeding Quests";
    case QuestType.PET_DOG: return "Petting Quests";
    case QuestType.TRAIN_DOG: return "Training Quests";
    case QuestType.WIN_COMBAT: return "Combat Quests";
    case QuestType.JOIN_GROUP: return "Group Quests";
    case QuestType.SEND_MESSAGE: return "Messaging Quests";
    default: return "Misc Quests";
  }
};

const getQuestDescription = (type: QuestType, target: number): string => {
  switch (type) {
    case QuestType.FEED_DOG: return `Feed your dogs ${target} times`;
    case QuestType.PET_DOG: return `Pet your dogs ${target} times`;
    case QuestType.TRAIN_DOG: return `Train your dogs ${target} times`;
    case QuestType.WIN_COMBAT: return `Win ${target} combat encounters`;
    case QuestType.JOIN_GROUP: return `Join ${target} group${target > 1 ? 's' : ''}`;
    case QuestType.SEND_MESSAGE: return `Send ${target} message${target > 1 ? 's' : ''} in group chat`;
    default: return `Complete ${target} tasks`;
  }
};

export default QuestPanel;
